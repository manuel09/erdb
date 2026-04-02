export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  backoff?: boolean;
}

/**
 * A robust fetch wrapper that handles timeouts and connection retries.
 * Useful for flaky external APIs like TMDB in some network environments.
 */
export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 15000, retries = 3, backoff = true, ...fetchOptions } = options;
  let lastError: Error | null = null;

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

      const message = `Fetch attempt ${attempt + 1} failed for ${url}: ${
        error.message || 'Unknown network error'
      }.`;

      if (attempt < retries) {
        console.warn(`${message} Retrying...`);
      } else {
        console.error(`${message} Max retries reached.`);
      }
    }
  }

  throw lastError || new Error(`Failed after ${retries} retries to ${url}`);
}
