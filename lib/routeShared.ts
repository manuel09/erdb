import { createHash, timingSafeEqual } from 'node:crypto';
import type { PhaseDurations, RenderedImagePayload } from '@/lib/routeTypes';

export const sha1Hex = (value: string) => createHash('sha1').update(value).digest('hex');

export const safeCompareText = (left: string, right: string) => {
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

export const measurePhase = async <T,>(phases: PhaseDurations, phase: keyof PhaseDurations, fn: () => Promise<T>) => {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    phases[phase] += performance.now() - start;
  }
};

// Must exceed worst-case fetch budget: 4 attempts at 15s + 1s + 2s + 4s backoff.
const DEDUPE_TIMEOUT_MS = 90_000;

export const withDedupe = async <T,>(
  inFlightMap: Map<string, Promise<T>>,
  key: string,
  factory: () => Promise<T>,
  timeoutMs: number = DEDUPE_TIMEOUT_MS
) => {
  const waitFor = (promise: Promise<T>) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Dedupe timeout: ${key}`)), timeoutMs);
      }),
    ]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  };

  const existing = inFlightMap.get(key);
  if (existing) return waitFor(existing);

  const fetchPromise = factory();
  inFlightMap.set(key, fetchPromise);

  // Timeout only limits caller wait. Keep shared work alive and deduped until it settles.
  fetchPromise.then(
    () => {
      if (inFlightMap.get(key) === fetchPromise) inFlightMap.delete(key);
    },
    () => {
      if (inFlightMap.get(key) === fetchPromise) inFlightMap.delete(key);
    }
  );

  return waitFor(fetchPromise);
};

export const buildServerTimingHeader = (phases: PhaseDurations, totalMs: number) => {
  const parts = [
    `auth;dur=${phases.auth.toFixed(1)}`,
    `tmdb;dur=${phases.tmdb.toFixed(1)}`,
    `mdb;dur=${phases.mdb.toFixed(1)}`,
    `stream;dur=${phases.stream.toFixed(1)}`,
    `render;dur=${phases.render.toFixed(1)}`,
    `total;dur=${totalMs.toFixed(1)}`,
  ];
  return parts.join(', ');
};

export const createImageHttpResponse = (
  payload: RenderedImagePayload,
  serverTiming: string,
  cacheStatus: 'hit' | 'miss' | 'shared'
) =>
  new Response(payload.body.slice(0), {
    status: 200,
    headers: {
      'Content-Type': payload.contentType,
      'Cache-Control': payload.cacheControl,
      Vary: 'Accept',
      'Server-Timing': serverTiming,
      'X-ERDB-Cache': cacheStatus,
    },
  });
