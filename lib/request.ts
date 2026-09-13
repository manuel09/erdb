export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  backoff?: boolean;
}

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

// ponytail: env knobs, code defaults unchanged.
const DEFAULT_TIMEOUT_MS = parsePositiveInt(process.env.ERDB_FETCH_TIMEOUT_MS, 15000);
const DEFAULT_RETRIES = parsePositiveInt(process.env.ERDB_FETCH_RETRIES, 3);
const MAX_CONCURRENT = parsePositiveInt(process.env.ERDB_FETCH_MAX_CONCURRENT, 96);

// ponytail: global cap on concurrent upstream sockets. One slow provider
// used to fan out hundreds of hung fetches per burst and starve the loop;
// extras queue instead of piling on.
let inFlightCount = 0;
const waitQueue: Array<() => void> = [];

const acquireSlot = async () => {
  if (inFlightCount < MAX_CONCURRENT) {
    inFlightCount += 1;
    return;
  }
  await new Promise<void>((resolve) => {
    waitQueue.push(resolve);
  });
  inFlightCount += 1;
};

const releaseSlot = () => {
  inFlightCount = Math.max(0, inFlightCount - 1);
  const next = waitQueue.shift();
  if (next) next();
};

/**
 * A robust fetch wrapper that handles timeouts and connection retries.
 * Useful for flaky external APIs like TMDB in some network environments.
 */
export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES, backoff = true, ...fetchOptions } = options;
  let lastError: Error | null = null;

  await acquireSlot();
  try {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      try {
        if (attempt > 0 && backoff) {
          // Exponential backoff with jitter (0.5s, 1s, 2s, etc.)
          const delay = Math.pow(2, attempt) * 500 + Math.random() * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        // Clear the timeout upon success
        clearTimeout(id);
        return response;
      } catch (error: any) {
        clearTimeout(id);
        lastError = error;

        // Identify transient network/timeout errors
        const isTimeout =
          error.name === 'AbortError' ||
          error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
          error.code === 'UND_ERR_HEADERS_TIMEOUT' ||
          error.code === 'UND_ERR_BODY_TIMEOUT' ||
          error.message?.toLowerCase().includes('timeout');
        const isNetworkError =
          error.message === 'fetch failed' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'EAI_AGAIN' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'EHOSTUNREACH' ||
          error.code === 'ENETUNREACH';

        if (!isTimeout && !isNetworkError) {
          // Log non-network errors immediately but throw them
          console.error(`Fetch encountered a non-transient error for ${url}:`, error.message);
          throw error;
        }

        // ponytail: quiet per-attempt warnings (log flood under burst costs
        // real CPU/IO). Only the final failure is logged below.
        if (attempt >= retries) {
          console.error(
            `Fetch attempt ${attempt + 1} failed for ${url}: ${error.message || 'Unknown network error'}. Max retries reached.`
          );
        }
      }
    }

    throw lastError || new Error(`Failed after ${retries} retries to ${url}`);
  } finally {
    releaseSlot();
  }
}
