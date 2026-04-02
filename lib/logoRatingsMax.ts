export const LOGO_RATINGS_MAX_MIN = 1;
export const LOGO_RATINGS_MAX_MAX = 20;
export const DEFAULT_LOGO_RATINGS_MAX: number | null = null;

export const normalizeLogoRatingsMax = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return DEFAULT_LOGO_RATINGS_MAX;
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(numericValue)) return DEFAULT_LOGO_RATINGS_MAX;
  const normalized = Math.trunc(numericValue);
  if (normalized < LOGO_RATINGS_MAX_MIN) return DEFAULT_LOGO_RATINGS_MAX;
  return Math.min(LOGO_RATINGS_MAX_MAX, normalized);
};
