#!/usr/bin/env node
const cluster = require('node:cluster');
const { availableParallelism } = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

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
