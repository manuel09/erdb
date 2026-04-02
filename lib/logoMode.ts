export type LogoMode = 'logo-ratings' | 'ratings-only' | 'custom-logo';

export const LOGO_MODE_OPTIONS: Array<{ id: LogoMode; label: string }> = [
  { id: 'logo-ratings', label: 'Default' },
  { id: 'ratings-only', label: 'Only Ratings' },
  { id: 'custom-logo', label: 'Custom logo' },
];

export const DEFAULT_LOGO_MODE: LogoMode = 'logo-ratings';
const LEGACY_LOGO_MODE_ALIASES: Record<string, LogoMode> = {
  'logo-5fonts-ratings': 'custom-logo',
};

export const isLogoMode = (value: unknown): value is LogoMode =>
  LOGO_MODE_OPTIONS.some((option) => option.id === value);

export const normalizeLogoMode = (value: unknown): LogoMode => {
  if (typeof value === 'string' && value in LEGACY_LOGO_MODE_ALIASES) {
    return LEGACY_LOGO_MODE_ALIASES[value];
  }
  return isLogoMode(value) ? value : DEFAULT_LOGO_MODE;
};
