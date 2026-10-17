export type RatingStyle = 'glass' | 'square' | 'plain' | 'solid-light';

// 'glass' (the glossy pill) is no longer offered in the UI; it stays accepted for saved configs.
export const DEFAULT_RATING_STYLE: RatingStyle = 'square';

export const RATING_STYLE_OPTIONS: Array<{ id: RatingStyle; label: string }> = [
  { id: 'square', label: 'Square Dark' },
  { id: 'plain', label: 'No Background' },
];

export const QUALITY_BADGE_STYLE_OPTIONS: Array<{ id: RatingStyle; label: string }> = [
  ...RATING_STYLE_OPTIONS,
];

// The genre chip has its own style so it can differ from the rating badges; default stays the
// historical look (plain text with glow).
export const DEFAULT_POSTER_GENRE_STYLE: RatingStyle = 'plain';

export const POSTER_GENRE_STYLE_OPTIONS: Array<{ id: RatingStyle; label: string }> = [
  ...RATING_STYLE_OPTIONS,
];

export const normalizePosterGenreStyle = (value?: string | null): RatingStyle => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'glass' || normalized === 'square' || normalized === 'plain') {
    return normalized;
  }
  return DEFAULT_POSTER_GENRE_STYLE;
};

export const normalizeRatingStyle = (value?: string | null): RatingStyle => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'glass' || normalized === 'square' || normalized === 'plain') {
    return normalized;
  }
  return DEFAULT_RATING_STYLE;
};

export const normalizeRatingsColorMode = (value?: string | null): 'colored' | 'transparent' => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'transparent' || normalized === 'colored') {
    return normalized;
  }
  return 'colored';
};
