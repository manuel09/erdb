#!/usr/bin/env node
const cluster = require('node:cluster');
const { availableParallelism } = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const resolveWorkerCount = () => {
  const rawValue = process.env.ERDB_WORKERS;
  if (!rawValue || rawValue === 'auto') {
    return Math.max(1, availableParallelism());
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    console.warn(
      `Invalid ERDB_WORKERS value "${rawValue}", falling back to 1 worker.`,
    );
    return 1;
  }

  return parsed;
};

const sleepSync = (ms) => {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // busy wait, used only during startup retries
  }
};

const isRetriableCopyError = (error) =>
  Boolean(error) &&
  (error.code === 'EPIPE' ||
    error.code === 'EBUSY' ||
    error.code === 'EPERM' ||
    error.code === 'EACCES');

const copyFileWithRetry = (sourceFile, targetFile, retries = 3) => {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      fs.copyFileSync(sourceFile, targetFile);
      return;
    } catch (error) {
      if (attempt === retries || !isRetriableCopyError(error)) {
        throw error;
      }
      sleepSync(75 * (attempt + 1));
    }
  }
};

const syncDirIfPresent = (sourceDir, targetDir) => {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  const sourceStats = fs.statSync(sourceDir);
  if (!sourceStats.isDirectory()) {
    copyFileWithRetry(sourceDir, targetDir);
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourceEntry = path.join(sourceDir, entry.name);
    const targetEntry = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      syncDirIfPresent(sourceEntry, targetEntry);
    } else if (entry.isFile()) {
      copyFileWithRetry(sourceEntry, targetEntry);
    }
  }
};

const readBuildId = (rootDir) => {
  const buildIdPath = path.join(rootDir, '.next', 'BUILD_ID');
  if (!fs.existsSync(buildIdPath)) {
    return null;
  }

  try {
    return fs.readFileSync(buildIdPath, 'utf8').trim();
  } catch {
    return null;
  }
};

const prepareLocalStandaloneAssets = (entrypoint) => {
  const standaloneDir = path.dirname(entrypoint);
  const projectRoot = path.resolve(__dirname, '..');
  const sourceBuildId = readBuildId(projectRoot);
  const standaloneBuildId = readBuildId(standaloneDir);
  const staticTargetDir = path.join(standaloneDir, '.next', 'static');
  const publicTargetDir = path.join(standaloneDir, 'public');
  const shouldSkipStaticSync =
    sourceBuildId &&
    standaloneBuildId &&
    sourceBuildId === standaloneBuildId &&
    fs.existsSync(staticTargetDir);
  const shouldSkipPublicSync = fs.existsSync(publicTargetDir);

  // When we run the standalone server directly from `.next/standalone`,
  // Next expects `public` and `.next/static` to live under that directory too.
  if (!shouldSkipStaticSync) {
    try {
      syncDirIfPresent(
        path.join(projectRoot, '.next', 'static'),
        staticTargetDir,
      );
    } catch (error) {
      if (!isRetriableCopyError(error)) {
        throw error;
      }
      console.warn('Unable to fully sync .next/static, continuing with existing standalone assets.');
    }
  }

  if (!shouldSkipPublicSync) {
    syncDirIfPresent(
      path.join(projectRoot, 'public'),
      publicTargetDir,
    );
  }
};

const workerCount = resolveWorkerCount();
const candidateEntrypoints = [
  path.resolve(__dirname, '..', '.next', 'standalone', 'server.js'),
  path.resolve(__dirname, '..', 'server.js'),
];
const serverEntrypoint = candidateEntrypoints.find((candidate) => fs.existsSync(candidate));

if (!serverEntrypoint) {
  console.error('Unable to find the Next.js standalone server entrypoint.');
  console.error(`Checked: ${candidateEntrypoints.join(', ')}`);
  process.exit(1);
}

if (serverEntrypoint.includes(`${path.sep}.next${path.sep}standalone${path.sep}`)) {
  prepareLocalStandaloneAssets(serverEntrypoint);
}

if (workerCount === 1) {
  require(serverEntrypoint);
} else if (cluster.isPrimary) {
  console.log(`Starting ERDB with ${workerCount} workers.`);

  for (let index = 0; index < workerCount; index += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(
      `Worker ${worker.process.pid} exited (${signal || code}). Restarting...`,
    );
    cluster.fork();
  });
} else {
  require(serverEntrypoint);
}
