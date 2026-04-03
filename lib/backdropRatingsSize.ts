export const BACKDROP_RATINGS_SIZE_OPTIONS = [
  { id: 'standard', label: 'Standard' },
  { id: 'large', label: 'Large' },
] as const;

export type BackdropRatingsSize = (typeof BACKDROP_RATINGS_SIZE_OPTIONS)[number]['id'];

export const DEFAULT_BACKDROP_RATINGS_SIZE: BackdropRatingsSize = 'standard';

const BACKDROP_RATINGS_SIZE_SET = new Set<BackdropRatingsSize>(
  BACKDROP_RATINGS_SIZE_OPTIONS.map((option) => option.id)
);

export const normalizeBackdropRatingsSize = (value?: string | null): BackdropRatingsSize => {
  const normalized = (value || '').trim().toLowerCase();
  return BACKDROP_RATINGS_SIZE_SET.has(normalized as BackdropRatingsSize)
    ? (normalized as BackdropRatingsSize)
    : DEFAULT_BACKDROP_RATINGS_SIZE;
};
