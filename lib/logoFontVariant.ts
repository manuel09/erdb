export type LogoFontVariant =
  | 'spicy-sale'
  | 'somelist'
  | 'rubik-spray-paint'
  | 'nabla'
  | 'honk'
  | 'paper-scratch'
  | 'sludgeborn'
  | 'playgum'
  | 'atlasmemo'
  | 'dracutaz'
  | 'banana-chips'
  | 'holy-star'
  | 'rocks-serif';

export const LOGO_FONT_VARIANT_OPTIONS: Array<{ id: LogoFontVariant; label: string }> = [
  { id: 'spicy-sale', label: 'Spicy Sale' },
  { id: 'somelist', label: 'Somelist' },
  { id: 'rubik-spray-paint', label: 'Rubik Spray Paint' },
  { id: 'nabla', label: 'Nabla' },
  { id: 'honk', label: 'Honk' },
  { id: 'paper-scratch', label: 'Paper Scratch' },
  { id: 'sludgeborn', label: 'Sludgeborn' },
  { id: 'playgum', label: 'Playgum' },
  { id: 'atlasmemo', label: 'Atlas Memo' },
  { id: 'dracutaz', label: 'Dracutaz' },
  { id: 'banana-chips', label: 'Banana Chips' },
  { id: 'holy-star', label: 'Holy Star' },
  { id: 'rocks-serif', label: 'Rocks Serif' },
];

export const DEFAULT_LOGO_FONT_VARIANT: LogoFontVariant = 'spicy-sale';

export const isLogoFontVariant = (value: unknown): value is LogoFontVariant =>
  LOGO_FONT_VARIANT_OPTIONS.some((option) => option.id === value);

export const normalizeLogoFontVariant = (value: unknown): LogoFontVariant =>
  isLogoFontVariant(value) ? value : DEFAULT_LOGO_FONT_VARIANT;
