import type {
  StreamBadgesSetting,
  QualityBadgesSide,
  PosterQualityBadgesPosition,
  PosterGenrePosition,
  RankingPosition,
  VerticalBadgeContent,
  AiometadataEpisodeProvider,
  ProxySeriesMetadataProvider,
  ProxyEpisodeProvider,
  ProxyType,
  PosterConfiguratorPreset,
} from '@/components/workspace/types';

export const PROXY_TYPES: ProxyType[] = ['poster', 'backdrop', 'logo', 'thumbnail'];
export const STREAM_BADGE_OPTIONS: Array<{ id: StreamBadgesSetting; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
];
export const QUALITY_BADGE_SIDE_OPTIONS: Array<{ id: QualityBadgesSide; label: string }> = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
export const POSTER_QUALITY_BADGE_POSITION_OPTIONS: Array<{
  id: PosterQualityBadgesPosition;
  label: string;
}> = [
  { id: 'auto', label: 'Auto' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'above-logo', label: 'Above Logo' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
export const POSTER_GENRE_POSITION_OPTIONS: Array<{ id: PosterGenrePosition; label: string }> = [
  { id: 'off', label: 'Off' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'above-logo', label: 'Above Logo' },
];
export const VERTICAL_BADGE_CONTENT_OPTIONS: Array<{ id: VerticalBadgeContent; label: string }> = [
  { id: 'standard', label: 'Standard' },
  { id: 'stacked', label: 'Stacked' },
];
export const AIOMETADATA_EPISODE_PROVIDER_OPTIONS: Array<{ id: AiometadataEpisodeProvider; label: string }> = [
  { id: 'realimdb', label: 'IMDb' },
  { id: 'tvdb', label: 'TVDB' },
];
export const PROXY_SERIES_METADATA_PROVIDER_OPTIONS: Array<{ id: ProxySeriesMetadataProvider; label: string }> = [
  { id: 'tmdb', label: 'TMDB' },
  { id: 'imdb', label: 'IMDb' },
];
export const PROXY_EPISODE_PROVIDER_OPTIONS: Array<{ id: ProxyEpisodeProvider; label: string }> = [
  { id: 'realimdb', label: 'IMDb' },
  { id: 'tvdb', label: 'TVDB' },
  { id: 'custom', label: 'Custom' },
];
export const RANKING_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'off', label: 'Off' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];
export const RANKING_POSITION_OPTIONS: Array<{ id: RankingPosition; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'above-logo', label: 'Above Logo' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
];
export const JUSTWATCH_COUNTRY_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'global', label: 'Global (US fallback)' },
  { id: 'AR', label: 'Argentina' },
  { id: 'AU', label: 'Australia' },
  { id: 'BR', label: 'Brazil' },
  { id: 'CA', label: 'Canada' },
  { id: 'DE', label: 'Germany' },
  { id: 'EG', label: 'Egypt' },
  { id: 'ES', label: 'Spain' },
  { id: 'FR', label: 'France' },
  { id: 'GB', label: 'United Kingdom' },
  { id: 'IN', label: 'India' },
  { id: 'IT', label: 'Italy' },
  { id: 'MX', label: 'Mexico' },
  { id: 'PL', label: 'Poland' },
  { id: 'TR', label: 'Turkey' },
  { id: 'US', label: 'United States' },
];

export type PosterPresetMeta = {
  id: PosterConfiguratorPreset;
  name: string;
  description: string;
  summary: string;
};

export const POSTER_PRESET_OPTIONS: PosterPresetMeta[] = [
  {
    id: 'preset1',
    name: 'Average Classic',
    description: 'Single average score, ranked on top, ratings at the bottom.',
    summary: 'Average rating · ratings bottom · quality + genre top · ranking top',
  },
  {
    id: 'preset2',
    name: 'Classic Split',
    description: 'Separate provider badges, same balanced layout, US chart.',
    summary: 'Ratings bottom · quality + genre top · ranking above logo',
  },
  {
    id: 'preset3',
    name: 'Top Rated',
    description: 'Ratings climb to the top, badges and genres drop to the bottom.',
    summary: 'Ratings top · quality + genre bottom · ranking above logo',
  },
  {
    id: 'preset4',
    name: 'Minimal',
    description: 'No quality badges, no genres: just ratings and the rank.',
    summary: 'Ratings top + bottom · no quality badges · ranking above logo',
  },
  {
    id: 'preset5',
    name: 'Logo Focus',
    description: 'Keeps the artwork clean by stacking everything above the logo.',
    summary: 'Ratings + quality + genres above logo · ranking top',
  },
  {
    id: 'preset6',
    name: 'Side Stacked',
    description: 'Vertical rating columns on the sides with stacked badges.',
    summary: 'Ratings left + right (stacked) · quality + genre bottom',
  },
  {
    id: 'preset7',
    name: 'Side Compact',
    description: 'Same side columns, but compact badges and a custom max count.',
    summary: 'Ratings left + right (compact) · quality + genre bottom',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Full manual control over every position, badge and toggle.',
    summary: 'Unlocks all layout, badge and ranking controls',
  },
];

export const PRESET_CONTROLS_NOTE =
  'Presets lock ratings position, badge placement, ranking position and vignette. Choose Custom to unlock them.';

export const INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition duration-200 placeholder:text-slate-600 focus:border-orange-400/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(249,115,22,0.16)]';
export const INPUT_COMPACT_CLASS =
  'rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition duration-200 placeholder:text-slate-600 focus:border-orange-400/50 focus:bg-white/[0.07]';

export const PANEL_CLASS =
  'relative flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] shadow-[0_34px_100px_-60px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-3xl';
export const PANEL_HEADER_CLASS = 'shrink-0 border-b border-white/5 px-4 py-3.5';
export const CARD_CLASS =
  'rounded-2xl border border-white/5 bg-black/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

export const BTN_BASE_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-40';
export const BTN_ACCENT_CLASS =
  'bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_18px_-6px_rgba(249,115,22,0.6)]';
export const BTN_GHOST_CLASS =
  'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white';
export const BTN_ACTIVE_CLASS = 'border border-orange-500/30 bg-orange-500/15 text-white';
export const BTN_INACTIVE_CLASS =
  'border border-white/5 bg-[#0a0a0a] text-slate-400 hover:bg-[#121212] hover:text-slate-200';

export const CHIP_ACTIVE_CLASS = 'border border-orange-500/30 bg-orange-500/15 text-white';
export const CHIP_INACTIVE_CLASS =
  'border border-white/5 bg-[#0a0a0a] text-slate-400 hover:bg-[#121212] hover:text-slate-200';

export const isCinemetaManifestUrl = (value: string) => {
  try {
    return /(^|[-.])cinemeta\.strem\.io$/i.test(new URL(value).hostname);
  } catch {
    return false;
  }
};
