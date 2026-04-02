import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync, unlinkSync, readdirSync, rmSync } from 'node:fs';
import { getCacheTtlMsFromCacheControl } from './imageCacheTtl';
import { DATA_DIR } from './paths';

const CACHE_DIR = join(DATA_DIR, 'cache', 'images');

type ObjectStorageResult = {
  body: ArrayBuffer;
  contentType: string;
  cacheControl: string;
};

const FALLBACK_IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const IMAGE_CACHE_PRUNE_INTERVAL_MS = 10 * 60 * 1000;

type GlobalObjectStorageState = typeof globalThis & {
  __erdbImageCachePruneTimer?: NodeJS.Timeout;
};

// Ensure cache directory exists
mkdirSync(CACHE_DIR, { recursive: true });

const sanitizePathSegment = (segment: string) => segment.replace(/[^a-zA-Z0-9._-]/g, '_');

const getFilePath = (key: string) => {
  const normalizedKey = String(key || '')
    .split(/[/\\]/)
    .map((segment) => sanitizePathSegment(segment))
    .filter(Boolean);
  return join(CACHE_DIR, ...normalizedKey);
};

const deleteCachedObject = (filePath: string, metadataPath: string) => {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup failures for stale cache files.
  }

  try {
    if (existsSync(metadataPath)) {
      unlinkSync(metadataPath);
    }
  } catch {
    // Ignore cleanup failures for stale cache metadata.
  }
};

const isCachedObjectExpired = (filePath: string, metadataPath: string) => {
  try {
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
    const cacheControl = metadata.cacheControl || 'public, max-age=300';
    const ttlMs = getCacheTtlMsFromCacheControl(cacheControl, FALLBACK_IMAGE_CACHE_TTL_MS);
    const { mtimeMs } = statSync(filePath);
    return mtimeMs + ttlMs <= Date.now();
  } catch {
    return true;
  }
};

export const pruneExpiredObjectStorageImages = () => {
  const walk = (dirPath: string) => {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        try {
          const remaining = readdirSync(entryPath);
          if (remaining.length === 0) {
            rmSync(entryPath, { recursive: true, force: true });
          }
        } catch {
          // Ignore cleanup failures for empty directories.
        }
        continue;
      }

      if (!entry.isFile() || entry.name.endsWith('.json')) {
        continue;
      }

      const filePath = entryPath;
      const metadataPath = `${filePath}.json`;

      if (!existsSync(metadataPath) || isCachedObjectExpired(filePath, metadataPath)) {
        deleteCachedObject(filePath, metadataPath);
      }
    }
  };

  try {
    walk(CACHE_DIR);
  } catch {
    // Ignore background pruning failures.
  }
};

const ensureObjectStoragePrunerStarted = () => {
  const globalState = globalThis as GlobalObjectStorageState;
  if (globalState.__erdbImageCachePruneTimer) {
    return;
  }

  pruneExpiredObjectStorageImages();
  globalState.__erdbImageCachePruneTimer = setInterval(pruneExpiredObjectStorageImages, IMAGE_CACHE_PRUNE_INTERVAL_MS);
};

export const isObjectStorageConfigured = () => true; // Always "configured" as local files

ensureObjectStoragePrunerStarted();

export const buildObjectStorageImageKey = (
  imageType: 'poster' | 'backdrop' | 'logo' | 'thumbnail',
  cacheHash: string,
  ext = 'png'
) => `final/${imageType}/${cacheHash}.${ext}`;
export const buildObjectStorageSourceImageKey = (id: string, variant: string) => `source/${id.replace(/[^a-zA-Z0-9]/g, '_')}_${variant}.png`;

export const getCachedImageFromObjectStorage = async (key: string): Promise<ObjectStorageResult | null> => {
  const filePath = getFilePath(key);
  const metadataPath = `${filePath}.json`;

  if (!existsSync(filePath) || !existsSync(metadataPath)) {
    return null;
  }

  try {
    const body = readFileSync(filePath);
    if (isCachedObjectExpired(filePath, metadataPath)) {
      deleteCachedObject(filePath, metadataPath);
      return null;
    }

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
    const cacheControl = metadata.cacheControl || 'public, max-age=300';

    return {
      body: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
      contentType: metadata.contentType || 'image/png',
      cacheControl,
    };
  } catch (error) {
    console.error(`Error reading cached image ${key}:`, error);
    return null;
  }
};

export const putCachedImageToObjectStorage = async (
  key: string,
  payload: { body: ArrayBuffer; contentType: string; cacheControl: string }
) => {
  const filePath = getFilePath(key);
  const metadataPath = `${filePath}.json`;

  try {
    // Ensure parent directories exist
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, Buffer.from(payload.body));
    writeFileSync(
      metadataPath,
      JSON.stringify({
        contentType: payload.contentType,
        cacheControl: payload.cacheControl,
      }),
      'utf8'
    );
  } catch (error) {
    console.error(`Error writing cached image ${key}:`, error);
  }
};
