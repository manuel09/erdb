export type RatingStyle = 'glass' | 'glass-colored' | 'glass-transparent' | 'square' | 'plain';

export type GlassColorMode = 'colored' | 'transparent';

// Quality badges and the genre chip carry their own Glass variant inside the style value
// ('glass-colored' / 'glass-transparent'), so their Style control stays the single source and no
// extra parameter has to travel through the stack. The route normalizes it back to 'glass'.
export const glassStyleVariant = (value?: string | null): GlassColorMode | null => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'glass-transparent') return 'transparent';
  if (normalized === 'glass-colored') return 'colored';
  return null;
};

export const GLASS_COLOR_MODE_OPTIONS: Array<{ id: GlassColorMode; label: string }> = [
  { id: 'transparent', label: 'Transparent' },
  { id: 'colored', label: 'Colored' },
];

export const DEFAULT_RATING_STYLE: RatingStyle = 'glass';

export const RATING_STYLE_OPTIONS: Array<{ id: RatingStyle; label: string }> = [
  { id: 'glass', label: 'Pill Glass' },
  { id: 'square', label: 'Square Dark' },
  { id: 'plain', label: 'No Background' },
];

// The genre chip has its own style so it can differ from the rating badges; default stays the
// historical look (plain text with glow).
export const DEFAULT_POSTER_GENRE_STYLE: RatingStyle = 'plain';

export const POSTER_GENRE_STYLE_OPTIONS: Array<{ id: RatingStyle; label: string }> = [
  ...RATING_STYLE_OPTIONS,
];

export const normalizePosterGenreStyle = (value?: string | null): RatingStyle => {
  const normalized = (value || '').trim().toLowerCase();
  if (glassStyleVariant(normalized)) return 'glass';
  if (normalized === 'glass' || normalized === 'square' || normalized === 'plain') {
    return normalized;
  }
  return DEFAULT_POSTER_GENRE_STYLE;
};

export const normalizeRatingStyle = (value?: string | null): RatingStyle => {
  const normalized = (value || '').trim().toLowerCase();
  if (glassStyleVariant(normalized)) return 'glass';
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
