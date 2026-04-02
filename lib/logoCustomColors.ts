export const DEFAULT_LOGO_CUSTOM_PRIMARY = '#fde68a';
export const DEFAULT_LOGO_CUSTOM_SECONDARY = '#f472b6';
export const DEFAULT_LOGO_CUSTOM_OUTLINE = '#2b0a3d';

const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i;

export const normalizeHexColor = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed.toLowerCase() : fallback;
};
