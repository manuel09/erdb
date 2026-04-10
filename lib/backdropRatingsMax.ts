export const BACKDROP_RATINGS_MAX_MIN = 1;
export const BACKDROP_RATINGS_MAX_MAX = 20;
export const DEFAULT_BACKDROP_RATINGS_MAX: number | null = null;

export const normalizeBackdropRatingsMax = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return DEFAULT_BACKDROP_RATINGS_MAX;
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(numericValue)) return DEFAULT_BACKDROP_RATINGS_MAX;
  const normalized = Math.trunc(numericValue);
  if (normalized < BACKDROP_RATINGS_MAX_MIN) return DEFAULT_BACKDROP_RATINGS_MAX;
  return Math.min(BACKDROP_RATINGS_MAX_MAX, normalized);
};
