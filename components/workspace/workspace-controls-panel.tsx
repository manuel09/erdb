'use client';

import { useMemo } from 'react';
import {
  type LucideIcon, Settings2, KeyRound, Palette, Globe2, LayoutGrid, Trophy, ListOrdered,
  Image as ImageIcon, Check, Type, SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dropdown } from './dropdown';
import { Card, Field, Notice, NumberStepper, PanelHeader, Toggle } from './ui';
import type { HomePageViewProps } from '@/components/workspace/types';
import { RatingProviderSortableList } from '@/components/rating-provider-sortable-list';
import { isVerticalPosterRatingLayout, type PosterRatingLayout } from '@/lib/posterRatingLayout';
import { RATING_STYLE_OPTIONS, type RatingStyle } from '@/lib/ratingStyle';
import { BACKDROP_RATING_LAYOUT_OPTIONS, type BackdropRatingLayout } from '@/lib/backdropRatingLayout';
import { BACKDROP_RATINGS_SIZE_OPTIONS, type BackdropRatingsSize } from '@/lib/backdropRatingsSize';
import { THUMBNAIL_RATING_LAYOUT_OPTIONS, type ThumbnailRatingLayout } from '@/lib/thumbnailRatingLayout';
import { THUMBNAIL_SIZE_OPTIONS, type ThumbnailSize } from '@/lib/thumbnailSize';
import { LOGO_MODE_OPTIONS } from '@/lib/logoMode';
import { LOGO_FONT_VARIANT_OPTIONS } from '@/lib/logoFontVariant';
import { LOGO_COLOR_PRESETS } from '@/lib/logoColorPresets';
import { POSTER_RATING_LAYOUT_OPTIONS } from '@/lib/posterRatingLayout';
import {
  BTN_BASE_CLASS,
  BTN_GHOST_CLASS,
  BTN_INACTIVE_CLASS,
  INPUT_CLASS,
  JUSTWATCH_COUNTRY_OPTIONS,
  PANEL_CLASS,
  PANEL_HEADER_CLASS,
  POSTER_GENRE_POSITION_OPTIONS,
  POSTER_PRESET_OPTIONS,
  POSTER_QUALITY_BADGE_POSITION_OPTIONS,
  PRESET_CONTROLS_NOTE,
  RANKING_OPTIONS,
  RANKING_POSITION_OPTIONS,
  STREAM_BADGE_OPTIONS,
  VERTICAL_BADGE_CONTENT_OPTIONS,
} from './constants';

type WorkspaceControlsPanelProps = Pick<HomePageViewProps, 'state' | 'derived' | 'actions'>;

function SectionTitle({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2.5 px-1">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-semibold text-slate-200">{title}</h3>
        {hint && <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

function KeyField({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            value ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[0.03] text-slate-500'
          }`}
        >
          {value ? 'Active' : 'Missing'}
        </span>
      </div>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={INPUT_CLASS}
      />
      <span className="text-[10px] leading-relaxed text-slate-500">{hint}</span>
    </div>
  );
}

export function WorkspaceControlsPanel({ state, derived, actions }: WorkspaceControlsPanelProps) {
  const {
    previewType,
    lang,
    supportedLanguages,
    tmdbKey,
    mdblistKey,
    simklClientId,
    fanartKey,
    posterLang,
    posterAnimeLang,
    backdropLang,
    backdropAnimeLang,
    logoLang,
    logoAnimeLang,
    posterAnimeImageText,
    backdropAnimeImageText,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    backdropRatingsLayout,
    backdropAsPoster,
    backdropRatingsMax,
    backdropRatingsSize,
    thumbnailRatingsLayout,
    thumbnailSize,
    logoMode,
    logoFontVariant,
    logoCustomPrimary,
    logoCustomSecondary,
    logoCustomOutline,
    logoRatingsMax,
    posterVerticalBadgeContent,
    thumbnailVerticalBadgeContent,
    backdropVerticalBadgeContent,
    posterConfiguratorPreset,
    posterAverageRatingsEnabled,
    posterVignetteEnabled,
    posterGenrePosition,
    posterQualityBadgesPosition,
    ranking,
    rankingCountry,
    rankingNoBox,
    rankingCompact,
    rankingPosition,
  } = state;

  const {
    activeRatingStyle,
    activeImageText,
    ratingProviderRows,
    activeStreamBadges,
    activeQualityBadgesStyle,
    activeQualityBadgesColorMode,
    activeRatingsColorMode,
  } = derived;

  const {
    setTmdbKey,
    setMdblistKey,
    setSimklClientId,
    setFanartKey,
    setPosterLang,
    setPosterAnimeLang,
    setBackdropLang,
    setBackdropAnimeLang,
    setLogoLang,
    setLogoAnimeLang,
    setRatingStyleForType,
    setRatingsColorModeForType,
    setImageTextForType,
    setPosterAnimeImageText,
    setBackdropAnimeImageText,
    setPosterRatingsLayout,
    setPosterRatingsMaxPerSide,
    setPosterVerticalBadgeContent,
    setBackdropRatingsLayout,
    setBackdropAsPoster,
    setBackdropRatingsMax,
    setBackdropRatingsSize,
    setBackdropVerticalBadgeContent,
    setThumbnailRatingsLayout,
    setThumbnailSize,
    setThumbnailVerticalBadgeContent,
    setPosterConfiguratorPreset,
    setPosterAverageRatingsEnabled,
    setPosterVignetteEnabled,
    setPosterGenrePosition,
    setLogoMode,
    setLogoFontVariant,
    setLogoCustomPrimary,
    setLogoCustomSecondary,
    setLogoCustomOutline,
    setLogoRatingsMax,
    setActiveStreamBadges,
    setActiveQualityBadgesStyle,
    setActiveQualityBadgesColorMode,
    setPosterQualityBadgesPosition,
    enableAllRatingPreferences,
    disableAllRatingPreferences,
    reorderRatingPreference,
    toggleRatingPreference,
    setRanking,
    setRankingCountry,
    setRankingNoBox,
    setRankingCompact,
    setRankingPosition,
  } = actions;

  const usesPosterSettings = previewType === 'poster' || (previewType === 'backdrop' && backdropAsPoster);
  const activePreset = POSTER_PRESET_OPTIONS.find((preset) => preset.id === posterConfiguratorPreset);
  const typeLabel =
    previewType === 'backdrop' && backdropAsPoster
      ? 'Backdrop as poster'
      : previewType.charAt(0).toUpperCase() + previewType.slice(1);
  const subtitle = usesPosterSettings ? `${typeLabel} · ${activePreset?.name ?? 'Preset'}` : typeLabel;

  const shouldShowVerticalBadgeContent =
    (previewType === 'poster' && isVerticalPosterRatingLayout(posterRatingsLayout)) ||
    (previewType === 'backdrop' && (backdropAsPoster ? isVerticalPosterRatingLayout(posterRatingsLayout) : backdropRatingsLayout === 'right-vertical')) ||
    (previewType === 'thumbnail' && thumbnailRatingsLayout.endsWith('-vertical'));

  const activeVerticalBadgeContent: string =
    previewType === 'thumbnail'
      ? thumbnailVerticalBadgeContent
      : previewType === 'backdrop' && !backdropAsPoster
        ? backdropVerticalBadgeContent
        : posterVerticalBadgeContent;

  const setActiveVerticalBadgeContent = (value: string) => {
    const setter =
      previewType === 'thumbnail'
        ? setThumbnailVerticalBadgeContent
        : previewType === 'backdrop' && !backdropAsPoster
          ? setBackdropVerticalBadgeContent
          : setPosterVerticalBadgeContent;
    setter(value as 'standard' | 'stacked');
  };

  const normalizedRankingCountry = rankingCountry === 'global' ? 'global' : rankingCountry.toUpperCase();
  const hasKnownRankingCountry = JUSTWATCH_COUNTRY_OPTIONS.some((option) => option.id === normalizedRankingCountry);

  const languageOptions = useMemo(
    () => [
      { id: '', label: `Global (${lang})` },
      { id: 'original', label: 'Native Language' },
      ...supportedLanguages.map((language) => ({
        id: language.code,
        label: `${language.flag} ${language.label}`,
      })),
    ],
    [lang, supportedLanguages]
  );

  const renderLanguage = (value: string, onChange: (val: string) => void) => (
    <Dropdown value={value} onChange={onChange} options={languageOptions} />
  );

  const renderDropdown = <T extends string>(
    value: T,
    onChange: (val: T) => void,
    options: readonly { readonly id: T; readonly label: string }[]
  ) => <Dropdown value={value} onChange={onChange} options={options} />;

  const showImageText = previewType === 'backdrop' || (usesPosterSettings && posterConfiguratorPreset === 'custom');
  const showRatingStyle = !usesPosterSettings || posterConfiguratorPreset !== 'preset7';
  const showPosterQualityBadges = usesPosterSettings && posterConfiguratorPreset !== 'preset4';
  const showBackdropQualityBadges = previewType === 'backdrop' && !backdropAsPoster;
  const showArtworkSection = previewType !== 'thumbnail';
  const averageRatingNotice =
    usesPosterSettings && (posterConfiguratorPreset === 'preset1' || (posterConfiguratorPreset === 'custom' && posterAverageRatingsEnabled));

  return (
    <div className={`${PANEL_CLASS} xl:order-1`}>
      <div className={PANEL_HEADER_CLASS}>
        <PanelHeader
          icon={<Settings2 className="h-4 w-4" />}
          title="Configuration"
          subtitle={subtitle}
          accent="orange"
        />
      </div>

      <div className="premium-scrollbar flex-1 space-y-6 overflow-y-auto p-4">
        <section className="space-y-3">
          <SectionTitle icon={KeyRound} title="API keys" hint="Optional integrations unlock more providers and artwork fallbacks." />

          <Card>
            <div className="space-y-4">
              <KeyField
                label="TMDB (v3 key)"
                value={tmdbKey}
                onChange={setTmdbKey}
                placeholder="Enter your TMDB API key"
                hint="Required for previews, title search and language selection."
              />
              <KeyField
                label="MDBList"
                value={mdblistKey}
                onChange={setMdblistKey}
                placeholder="Optional integration"
                hint="Unlocks MDBList ratings on posters."
              />
              <KeyField
                label="SIMKL Client ID"
                value={simklClientId}
                onChange={setSimklClientId}
                placeholder="Optional integration"
                hint="Unlocks SIMKL ratings."
              />
              <KeyField
                label="Fanart.tv API key"
                value={fanartKey}
                onChange={setFanartKey}
                placeholder="Optional integration"
                hint="Fallback for Clean posters and backdrops when TMDB has no artwork."
              />
            </div>
          </Card>
        </section>

        {usesPosterSettings && (
          <section className="space-y-3">
            <SectionTitle
              icon={Palette}
              title="Preset"
              hint="Start from a proven layout, then switch to Custom for full manual control."
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {POSTER_PRESET_OPTIONS.map((preset) => {
                const isActive = posterConfiguratorPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPosterConfiguratorPreset(preset.id)}
                    aria-pressed={isActive}
                    className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 text-left transition-all ${
                      isActive
                        ? 'border-orange-400/40 bg-orange-500/10 shadow-[0_0_24px_-14px_rgba(249,115,22,0.9)]'
                        : 'border-white/5 bg-black/30 hover:border-white/10 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-200'}`}>{preset.name}</span>
                      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-orange-400" />}
                    </span>
                    <span className="text-[10px] leading-relaxed text-slate-500">{preset.description}</span>
                    <span className="text-[10px] leading-relaxed text-slate-600">{preset.summary}</span>
                  </button>
                );
              })}
            </div>
            {posterConfiguratorPreset !== 'custom' && <Notice tone="info">{PRESET_CONTROLS_NOTE}</Notice>}
          </section>
        )}

        {showArtworkSection && (
          <section className="space-y-3">
            <SectionTitle icon={ImageIcon} title="Artwork" hint="Source image, artwork variant and per-type language." />

            {previewType === 'backdrop' && (
              <Toggle
                checked={backdropAsPoster}
                onChange={setBackdropAsPoster}
                label="Use backdrop as poster"
                hint="Landscape image with all poster layout, badge and rating settings."
              />
            )}

            <Card>
              {!tmdbKey ? (
                <Notice tone="warning" title="TMDB key required">
                  Add a TMDB key in the API keys section above to load artwork in a specific language.
                </Notice>
              ) : (
                <div className="space-y-3">
                  {previewType === 'poster' ? (
                    <>
                      <Field label="Poster language">{renderLanguage(posterLang, setPosterLang)}</Field>
                      <Field label="Poster language (anime)">{renderLanguage(posterAnimeLang, setPosterAnimeLang)}</Field>
                    </>
                  ) : previewType === 'backdrop' ? (
                    <>
                      <Field label="Backdrop language">{renderLanguage(backdropLang, setBackdropLang)}</Field>
                      <Field label="Backdrop language (anime)">{renderLanguage(backdropAnimeLang, setBackdropAnimeLang)}</Field>
                    </>
                  ) : (
                    <>
                      <Field label="Logo language">{renderLanguage(logoLang, setLogoLang)}</Field>
                      <Field label="Logo language (anime)">{renderLanguage(logoAnimeLang, setLogoAnimeLang)}</Field>
                    </>
                  )}
                </div>
              )}
            </Card>

          </section>
        )}

        {showImageText && (
          <section className="space-y-3">
            <SectionTitle icon={Type} title="Artwork text" hint="Base artwork variant used before badges are drawn." />
            <Card>
              <div className="space-y-3">
                <Field label="Base artwork">
                  {renderDropdown(activeImageText, setImageTextForType, [
                    { id: 'default', label: 'Default' },
                    { id: 'clean', label: 'Clean' },
                    { id: 'alternative', label: 'Alternative' },
                  ])}
                </Field>
                <Field label="Anime override (Kitsu/MAL)">
                  {renderDropdown(
                    usesPosterSettings ? posterAnimeImageText : backdropAnimeImageText,
                    usesPosterSettings ? setPosterAnimeImageText : setBackdropAnimeImageText,
                    [
                      { id: 'default', label: 'Default' },
                      { id: 'clean', label: 'Clean' },
                      { id: 'alternative', label: 'Alternative' },
                    ]
                  )}
                </Field>
              </div>
            </Card>
          </section>
        )}

        <section className="space-y-3">
          <SectionTitle icon={SlidersHorizontal} title="Style" hint="Rating badge look and quality indicators." />

          {showRatingStyle && (
            <Card title="Rating style">
              <div className="space-y-3">
                {renderDropdown(activeRatingStyle, (value) => setRatingStyleForType(value as RatingStyle), RATING_STYLE_OPTIONS)}
                {activeRatingStyle === 'glass' && (
                  <Field label="Glass style">
                    {renderDropdown(
                      activeRatingsColorMode,
                      (value) => setRatingsColorModeForType(value as 'colored' | 'transparent'),
                      [
                        { id: 'colored', label: 'Colored' },
                        { id: 'transparent', label: 'Transparent' },
                      ]
                    )}
                  </Field>
                )}
              </div>
            </Card>
          )}

          {(showPosterQualityBadges || showBackdropQualityBadges) && (
            <Card title="Quality badges" description="Stream quality indicators (4K, HDR, and similar) added to the artwork.">
              <div className={`grid gap-3 ${showPosterQualityBadges && posterConfiguratorPreset === 'custom' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {(showBackdropQualityBadges || posterConfiguratorPreset === 'custom') && (
                  <Field label="Mode">
                    {renderDropdown(activeStreamBadges, setActiveStreamBadges, STREAM_BADGE_OPTIONS)}
                  </Field>
                )}
                <Field label="Style">
                  {renderDropdown(activeQualityBadgesStyle, (value) => setActiveQualityBadgesStyle(value as RatingStyle), RATING_STYLE_OPTIONS)}
                </Field>
                <Field label="Badge style">
                  {renderDropdown(activeQualityBadgesColorMode, setActiveQualityBadgesColorMode, [
                    { id: 'white', label: 'White' },
                    { id: 'colored', label: 'Colored' },
                  ])}
                </Field>
              </div>
            </Card>
          )}

          {previewType === 'logo' && (
            <Notice tone="info">Logo artwork only shows rating badges. Quality badges and rankings apply to posters and backdrops.</Notice>
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle icon={LayoutGrid} title="Layout" hint="Where ratings, badges, genres and overlays are placed." />

          {usesPosterSettings && (
            <Card>
              <div className="space-y-3">
                <Toggle
                  checked={posterVignetteEnabled}
                  onChange={setPosterVignetteEnabled}
                  label="Vignette"
                  hint="Darken the poster edges for extra readability."
                />

                {posterConfiguratorPreset === 'preset7' && (
                  <Field label="Max badges per side">
                    <NumberStepper
                      value={posterRatingsMaxPerSide}
                      onChange={setPosterRatingsMaxPerSide}
                      onReset={() => setPosterRatingsMaxPerSide(null)}
                    />
                  </Field>
                )}

                {posterConfiguratorPreset === 'custom' && (
                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <Field label="Ratings position">
                      {renderDropdown(posterRatingsLayout, setPosterRatingsLayout, POSTER_RATING_LAYOUT_OPTIONS)}
                    </Field>
                    {isVerticalPosterRatingLayout(posterRatingsLayout) && (
                      <>
                        <Field label="Vertical badge style">
                          {renderDropdown(posterVerticalBadgeContent, setPosterVerticalBadgeContent, VERTICAL_BADGE_CONTENT_OPTIONS)}
                        </Field>
                        <Field label="Max badges per side">
                          <NumberStepper
                            value={posterRatingsMaxPerSide}
                            onChange={setPosterRatingsMaxPerSide}
                            onReset={() => setPosterRatingsMaxPerSide(null)}
                          />
                        </Field>
                      </>
                    )}
                    <Field label="Genre position">
                      {renderDropdown(posterGenrePosition, setPosterGenrePosition, POSTER_GENRE_POSITION_OPTIONS)}
                    </Field>
                    <Field label="Quality badges position">
                      {renderDropdown(posterQualityBadgesPosition, setPosterQualityBadgesPosition, POSTER_QUALITY_BADGE_POSITION_OPTIONS)}
                    </Field>
                    <Toggle
                      checked={posterAverageRatingsEnabled}
                      onChange={setPosterAverageRatingsEnabled}
                      label="Average ratings"
                      hint="Show one badge with the average of all active providers."
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {previewType === 'backdrop' && !backdropAsPoster && (
            <Card>
              <div className="space-y-3">
                <Field label="Ratings position">
                  {renderDropdown(backdropRatingsLayout, (value) => setBackdropRatingsLayout(value as BackdropRatingLayout), BACKDROP_RATING_LAYOUT_OPTIONS)}
                </Field>
                <Field label="Ratings size">
                  {renderDropdown(backdropRatingsSize, (value) => setBackdropRatingsSize(value as BackdropRatingsSize), BACKDROP_RATINGS_SIZE_OPTIONS)}
                </Field>
                {shouldShowVerticalBadgeContent && (
                  <Field label="Vertical badge style">
                    {renderDropdown(
                      activeVerticalBadgeContent as 'standard' | 'stacked',
                      setActiveVerticalBadgeContent,
                      VERTICAL_BADGE_CONTENT_OPTIONS
                    )}
                  </Field>
                )}
                <Field label="Max badges">
                  <NumberStepper
                    value={backdropRatingsMax}
                    onChange={setBackdropRatingsMax}
                    onReset={() => setBackdropRatingsMax(null)}
                  />
                </Field>
              </div>
            </Card>
          )}

          {previewType === 'thumbnail' && (
            <Card>
              <div className="space-y-3">
                <Field label="Ratings position">
                  {renderDropdown(thumbnailRatingsLayout, (value) => setThumbnailRatingsLayout(value as ThumbnailRatingLayout), THUMBNAIL_RATING_LAYOUT_OPTIONS)}
                </Field>
                <Field label="Thumbnail size">
                  {renderDropdown(thumbnailSize, (value) => setThumbnailSize(value as ThumbnailSize), THUMBNAIL_SIZE_OPTIONS)}
                </Field>
                {shouldShowVerticalBadgeContent && (
                  <Field label="Vertical badge style">
                    {renderDropdown(
                      activeVerticalBadgeContent as 'standard' | 'stacked',
                      setActiveVerticalBadgeContent,
                      VERTICAL_BADGE_CONTENT_OPTIONS
                    )}
                  </Field>
                )}
              </div>
            </Card>
          )}

          {previewType === 'logo' && (
            <Card>
              <div className="space-y-3">
                <Field label="Logo mode">{renderDropdown(logoMode, setLogoMode, LOGO_MODE_OPTIONS)}</Field>

                <AnimatePresence mode="popLayout" initial={false}>
                  {logoMode === 'custom-logo' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <Field label="Logo font">
                        {renderDropdown(logoFontVariant, setLogoFontVariant, LOGO_FONT_VARIANT_OPTIONS)}
                      </Field>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {(
                          [
                            ['Primary', logoCustomPrimary, setLogoCustomPrimary],
                            ['Secondary', logoCustomSecondary, setLogoCustomSecondary],
                            ['Outline', logoCustomOutline, setLogoCustomOutline],
                          ] as const
                        ).map(([label, value, onChange]) => (
                          <Field key={label} label={label}>
                            <div className="flex min-w-0 items-center gap-2">
                              <input
                                type="color"
                                value={value}
                                onChange={(event) => onChange(event.target.value)}
                                aria-label={`${label} color`}
                                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
                              />
                              <input
                                type="text"
                                value={value}
                                onChange={(event) => onChange(event.target.value)}
                                className={`min-w-0 flex-1 ${INPUT_CLASS}`}
                              />
                            </div>
                          </Field>
                        ))}
                      </div>
                      <Field label="Color presets">
                        <div className="flex flex-wrap gap-2">
                          {LOGO_COLOR_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setLogoCustomPrimary(preset.primary);
                                setLogoCustomSecondary(preset.secondary);
                                setLogoCustomOutline(preset.outline);
                              }}
                              className={`${BTN_BASE_CLASS} ${BTN_INACTIVE_CLASS} cursor-pointer px-3 py-2`}
                              title={`Apply ${preset.id} palette`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {[preset.primary, preset.secondary, preset.outline].map((color) => (
                                  <span key={color} className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                                ))}
                              </span>
                            </button>
                          ))}
                        </div>
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field label="Max badges">
                  <NumberStepper value={logoRatingsMax} onChange={setLogoRatingsMax} onReset={() => setLogoRatingsMax(null)} />
                </Field>
              </div>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle icon={Trophy} title="Ranking" hint="JustWatch popularity rank drawn on the artwork." />

          {!usesPosterSettings ? (
            <Notice tone="info" title="Posters only">
              JustWatch rankings are available on posters and on backdrops rendered as posters.
            </Notice>
          ) : (
            <Card>
              <div className="space-y-3">
                <Field label="Interval">{renderDropdown(ranking, setRanking, RANKING_OPTIONS)}</Field>

                <AnimatePresence initial={false}>
                  {ranking !== 'off' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <Field label="Chart country">
                        <div className="flex items-center gap-2">
                          <Globe2 className="h-4 w-4 shrink-0 text-slate-500" />
                          <select
                            value={hasKnownRankingCountry ? normalizedRankingCountry : rankingCountry}
                            onChange={(event) => setRankingCountry(event.target.value)}
                            aria-label="Chart country"
                            className={INPUT_CLASS}
                          >
                            {!hasKnownRankingCountry && <option value={rankingCountry}>{rankingCountry}</option>}
                            {JUSTWATCH_COUNTRY_OPTIONS.map((option) => (
                              <option key={option.id} value={option.id} className="bg-[#0a0a0a]">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Field>

                      <Toggle
                        checked={rankingNoBox}
                        onChange={setRankingNoBox}
                        label="Hide background box"
                        hint="Draw the rank directly on the artwork without a container."
                      />

                      {posterConfiguratorPreset === 'custom' && (
                        <div className="space-y-3 border-t border-white/5 pt-3">
                          <Field label="Ranking position">
                            {renderDropdown(rankingPosition, setRankingPosition, RANKING_POSITION_OPTIONS)}
                          </Field>
                          <Toggle
                            checked={rankingCompact}
                            onChange={setRankingCompact}
                            label="Compact badge"
                            hint="Use the smaller rank badge variant."
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle icon={ListOrdered} title="Providers" hint="Which sources feed the rating badges, in display order." />

          <Card>
            <div className="space-y-3">
              {averageRatingNotice && (
                <Notice tone="warning" title="Average rating active">
                  {posterConfiguratorPreset === 'preset1'
                    ? 'This preset shows a single average score computed from all active providers.'
                    : 'Calculates one average badge from all active providers.'}
                </Notice>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={enableAllRatingPreferences}
                  className={`${BTN_BASE_CLASS} ${BTN_INACTIVE_CLASS} cursor-pointer px-3 py-2`}
                >
                  Enable all
                </button>
                <button
                  type="button"
                  onClick={disableAllRatingPreferences}
                  className={`${BTN_BASE_CLASS} ${BTN_INACTIVE_CLASS} cursor-pointer px-3 py-2`}
                >
                  Disable all
                </button>
              </div>

              <p className="text-[10px] text-slate-500">Drag the grips to reorder. Order flows from the first badge to the last.</p>

              <RatingProviderSortableList
                rows={ratingProviderRows}
                onReorder={reorderRatingPreference}
                onToggle={toggleRatingPreference}
                fillDirection="column"
                singleColumnOnMobile
              />
            </div>
          </Card>
        </section>

        <Notice tone="info" title="Applying changes">
          Changes are previewed instantly. With a token account, press <span className="font-semibold">Save</span> in the
          top bar to push them to your installed addons.
        </Notice>
      </div>
    </div>
  );
}
