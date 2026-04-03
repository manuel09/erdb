'use client';
import Link from 'next/link';
import {
  useEffect,
  useState,
  type ChangeEvent,
  type Dispatch,
  type MouseEvent,
  type RefObject,
  type SetStateAction,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import type { ProxyCatalogDescriptor } from '@/lib/proxyCatalog';
import type { SupportedLanguage } from '@/lib/tmdbLanguage';
import {
  ArrowLeft,
  Image as ImageIcon,
  Star,
  Settings2,
  Globe2,
  Layers,
  Code2,
  Terminal,
  ExternalLink,
  Zap,
  ChevronRight,
  Hash,
  MonitorPlay,
  Bot,
  Clipboard,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  RefreshCcw,
  Save,
  ShieldAlert,
} from 'lucide-react';
import type { RatingPreference } from '@/lib/ratingPreferences';
import type { RatingProviderRow } from '@/lib/ratingRows';
import { RatingProviderSortableList } from '@/components/rating-provider-sortable-list';
import {
  BACKDROP_RATING_LAYOUT_OPTIONS,
  type BackdropRatingLayout,
} from '@/lib/backdropRatingLayout';
import {
  THUMBNAIL_RATING_LAYOUT_OPTIONS,
  type ThumbnailRatingLayout,
} from '@/lib/thumbnailRatingLayout';
import {
  THUMBNAIL_SIZE_OPTIONS,
  type ThumbnailSize,
} from '@/lib/thumbnailSize';
import {
  BACKDROP_RATINGS_SIZE_OPTIONS,
  type BackdropRatingsSize,
} from '@/lib/backdropRatingsSize';
import {
  POSTER_RATING_LAYOUT_OPTIONS,
  isVerticalPosterRatingLayout,
  type PosterRatingLayout,
} from '@/lib/posterRatingLayout';
import {
  RATING_STYLE_OPTIONS,
  type RatingStyle,
} from '@/lib/ratingStyle';
import {
  LOGO_MODE_OPTIONS,
  type LogoMode,
} from '@/lib/logoMode';
import {
  LOGO_FONT_VARIANT_OPTIONS,
  type LogoFontVariant,
} from '@/lib/logoFontVariant';
import {
  DEFAULT_LOGO_CUSTOM_PRIMARY,
  DEFAULT_LOGO_CUSTOM_SECONDARY,
  DEFAULT_LOGO_CUSTOM_OUTLINE,
} from '@/lib/logoCustomColors';
import { LOGO_COLOR_PRESETS } from '@/lib/logoColorPresets';

type PreviewType = 'poster' | 'backdrop' | 'logo' | 'thumbnail';
type ProxyType = PreviewType;
type ProxyEnabledTypes = Record<ProxyType, boolean>;
type StreamBadgesSetting = 'auto' | 'on' | 'off';
type QualityBadgesSide = 'left' | 'right';
type PosterQualityBadgesPosition = 'auto' | QualityBadgesSide;
type AiometadataPatternType = 'poster' | 'background' | 'logo' | 'episodeThumbnail';
type AiometadataEpisodeProvider = 'tvdb' | 'realimdb';
type ProxySeriesMetadataProvider = 'tmdb' | 'imdb';
type ProxyEpisodeProvider = 'custom' | 'realimdb' | 'tvdb';
type VerticalBadgeContent = 'standard' | 'stacked';

type HomePageViewState = {
  previewType: PreviewType;
  mediaId: string;
  lang: string;
  posterLang: string;
  posterAnimeLang: string;
  backdropLang: string;
  backdropAnimeLang: string;
  logoLang: string;
  logoAnimeLang: string;
  posterAnimeImageText: 'default' | 'clean' | 'alternative';
  backdropAnimeImageText: 'default' | 'clean' | 'alternative';
  supportedLanguages: SupportedLanguage[];
  tmdbKey: string;
  mdblistKey: string;
  simklClientId: string;
  proxyManifestUrl: string;
  proxyCatalogs: ProxyCatalogDescriptor[];
  proxyCatalogNames: Record<string, string>;
  proxyHiddenCatalogs: string[];
  proxySearchDisabledCatalogs: string[];
  proxyDiscoverOnlyCatalogs: Record<string, boolean>;
  proxyCatalogsStatus: 'idle' | 'loading' | 'ready' | 'error';
  proxyCatalogsError: string;
  proxySeriesMetadataProvider: ProxySeriesMetadataProvider;
  proxyAiometadataProvider: ProxyEpisodeProvider;
  proxyEnabledTypes: ProxyEnabledTypes;
  proxyTranslateMeta: boolean;
  exportStatus: 'idle' | 'with' | 'without';
  importStatus: 'idle' | 'success' | 'error';
  importMessage: string;
  posterRatingsLayout: PosterRatingLayout;
  posterRatingsMaxPerSide: number | null;
  logoRatingsMax: number | null;
  logoMode: LogoMode;
  logoFontVariant: LogoFontVariant;
  logoCustomPrimary: string;
  logoCustomSecondary: string;
  logoCustomOutline: string;
  backdropRatingsLayout: BackdropRatingLayout;
  backdropRatingsSize: BackdropRatingsSize;
  thumbnailRatingsLayout: ThumbnailRatingLayout;
  posterVerticalBadgeContent: VerticalBadgeContent;
  backdropVerticalBadgeContent: VerticalBadgeContent;
  thumbnailVerticalBadgeContent: VerticalBadgeContent;
  thumbnailSize: ThumbnailSize;
  qualityBadgesSide: QualityBadgesSide;
  posterQualityBadgesPosition: PosterQualityBadgesPosition;
  proxyCopied: boolean;
  copied: boolean;
  aiometadataCopiedType: AiometadataPatternType | null;
  aiometadataEpisodeProvider: AiometadataEpisodeProvider;
  activeToken: string | null;
  configSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
};

type HomePageViewDerived = {
  baseUrl: string;
  previewUrl: string;
  proxyUrl: string;
  currentVersion: string;
  githubPackageVersion: string | null;
  repoUrl: string | null;
  previewNotice: string | null;
  canGenerateProxy: boolean;
  isProxyUrlVisible: boolean;
  displayedProxyUrl: string;
  styleLabel: string;
  textLabel: string;
  providersLabel: string;
  activeRatingStyle: RatingStyle;
  activeImageText: 'default' | 'clean' | 'alternative';
  ratingProviderRows: RatingProviderRow[];
  shouldShowQualityBadgesPosition: boolean;
  shouldShowQualityBadgesSide: boolean;
  qualityBadgeTypeLabel: string;
  activeStreamBadges: StreamBadgesSetting;
  activeQualityBadgesStyle: RatingStyle;
  aiometadataPatterns: Record<AiometadataPatternType, string>;
};

type HomePageViewActions = {
  handleAnchorClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  handleExportConfig: (includeKeys: boolean) => void;
  handleImportFile: (event: ChangeEvent<HTMLInputElement>) => void;
  handleImportConfigString: (value: string) => void;
  handleCopyProxy: () => void;
  handleCopyPrompt: () => void;
  handleCopyAiometadataPattern: (type: AiometadataPatternType) => void;
  setPreviewType: Dispatch<SetStateAction<PreviewType>>;
  setMediaId: Dispatch<SetStateAction<string>>;
  setLang: Dispatch<SetStateAction<string>>;
  setPosterLang: Dispatch<SetStateAction<string>>;
  setPosterAnimeLang: Dispatch<SetStateAction<string>>;
  setBackdropLang: Dispatch<SetStateAction<string>>;
  setBackdropAnimeLang: Dispatch<SetStateAction<string>>;
  setLogoLang: Dispatch<SetStateAction<string>>;
  setLogoAnimeLang: Dispatch<SetStateAction<string>>;
  setPosterAnimeImageText: Dispatch<SetStateAction<'default' | 'clean' | 'alternative'>>;
  setBackdropAnimeImageText: Dispatch<SetStateAction<'default' | 'clean' | 'alternative'>>;
  setTmdbKey: Dispatch<SetStateAction<string>>;
  setMdblistKey: Dispatch<SetStateAction<string>>;
  setSimklClientId: Dispatch<SetStateAction<string>>;
  setPosterRatingsLayout: Dispatch<SetStateAction<PosterRatingLayout>>;
  setPosterRatingsMaxPerSide: Dispatch<SetStateAction<number | null>>;
  setLogoRatingsMax: Dispatch<SetStateAction<number | null>>;
  setLogoMode: Dispatch<SetStateAction<LogoMode>>;
  setLogoFontVariant: Dispatch<SetStateAction<LogoFontVariant>>;
  setLogoCustomPrimary: Dispatch<SetStateAction<string>>;
  setLogoCustomSecondary: Dispatch<SetStateAction<string>>;
  setLogoCustomOutline: Dispatch<SetStateAction<string>>;
  setBackdropRatingsLayout: Dispatch<SetStateAction<BackdropRatingLayout>>;
  setBackdropRatingsSize: Dispatch<SetStateAction<BackdropRatingsSize>>;
  setThumbnailRatingsLayout: Dispatch<SetStateAction<ThumbnailRatingLayout>>;
  setPosterVerticalBadgeContent: Dispatch<SetStateAction<VerticalBadgeContent>>;
  setBackdropVerticalBadgeContent: Dispatch<SetStateAction<VerticalBadgeContent>>;
  setThumbnailVerticalBadgeContent: Dispatch<SetStateAction<VerticalBadgeContent>>;
  setThumbnailSize: Dispatch<SetStateAction<ThumbnailSize>>;
  setAiometadataEpisodeProvider: Dispatch<SetStateAction<AiometadataEpisodeProvider>>;
  setProxySeriesMetadataProvider: Dispatch<SetStateAction<ProxySeriesMetadataProvider>>;
  setProxyAiometadataProvider: Dispatch<SetStateAction<ProxyEpisodeProvider>>;
  setPosterQualityBadgesPosition: Dispatch<SetStateAction<PosterQualityBadgesPosition>>;
  setQualityBadgesSide: Dispatch<SetStateAction<QualityBadgesSide>>;
  setRatingStyleForType: (value: RatingStyle) => void;
  setImageTextForType: (value: 'default' | 'clean' | 'alternative') => void;
  setActiveStreamBadges: Dispatch<SetStateAction<StreamBadgesSetting>>;
  setActiveQualityBadgesStyle: Dispatch<SetStateAction<RatingStyle>>;
  toggleRatingPreference: (rating: RatingPreference) => void;
  enableAllRatingPreferences: () => void;
  disableAllRatingPreferences: () => void;
  reorderRatingPreference: (fromIndex: number, toIndex: number) => void;
  updateProxyManifestUrl: (value: string) => void;
  updateProxyCatalogName: (key: string, value: string) => void;
  toggleProxyCatalogHidden: (key: string) => void;
  toggleProxyCatalogSearchDisabled: (key: string) => void;
  setProxyCatalogDiscoverOnly: (key: string, enabled: boolean) => void;
  resetProxyCatalogNames: () => void;
  resetProxyCatalogCustomizations: () => void;
  toggleProxyEnabledType: (type: ProxyType) => void;
  toggleProxyTranslateMeta: () => void;
  toggleProxyUrlVisibility: () => void;
  handleTokenDisconnect: () => void;
  handleSaveConfig: () => void;
};

export type HomePageViewProps = {
  mode?: 'landing' | 'workspace';
  refs: {
    navRef: RefObject<HTMLElement | null>;
  };
  state: HomePageViewState;
  derived: HomePageViewDerived;
  actions: HomePageViewActions;
};

const PROXY_TYPES: ProxyType[] = ['poster', 'backdrop', 'logo', 'thumbnail'];
const STREAM_BADGE_OPTIONS: Array<{ id: StreamBadgesSetting; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
];
const QUALITY_BADGE_SIDE_OPTIONS: Array<{ id: QualityBadgesSide; label: string }> = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
const POSTER_QUALITY_BADGE_POSITION_OPTIONS: Array<{
  id: PosterQualityBadgesPosition;
  label: string;
}> = [
    { id: 'auto', label: 'Auto' },
    { id: 'left', label: 'Left' },
    { id: 'right', label: 'Right' },
  ];
const VERTICAL_BADGE_CONTENT_OPTIONS: Array<{ id: VerticalBadgeContent; label: string }> = [
  { id: 'standard', label: 'Standard' },
  { id: 'stacked', label: 'Stacked' },
];
const AIOMETADATA_EPISODE_PROVIDER_OPTIONS: Array<{ id: AiometadataEpisodeProvider; label: string }> = [
  { id: 'realimdb', label: 'IMDb' },
  { id: 'tvdb', label: 'TVDB' },
];
const PROXY_SERIES_METADATA_PROVIDER_OPTIONS: Array<{ id: ProxySeriesMetadataProvider; label: string }> = [
  { id: 'tmdb', label: 'TMDB' },
  { id: 'imdb', label: 'IMDb' },
];
const PROXY_EPISODE_PROVIDER_OPTIONS: Array<{ id: ProxyEpisodeProvider; label: string }> = [
  { id: 'realimdb', label: 'IMDb' },
  { id: 'tvdb', label: 'TVDB' },
  { id: 'custom', label: 'Custom' },
];
const INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition duration-200 focus:border-orange-400/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_1px_rgba(249,115,22,0.16)]';
const INPUT_COMPACT_CLASS =
  'rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition duration-200 focus:border-orange-400/50 focus:bg-white/[0.07]';
const SEGMENT_CLASS =
  'flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
const INNER_PANEL_CLASS =
  'rounded-[22px] border border-white/10 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';
const CODE_PANEL_CLASS =
  'rounded-[22px] border border-white/10 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
const CONFIG_PANEL_CLASS =
  'relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_34px_100px_-60px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-3xl';
const PREVIEW_PANEL_CLASS =
  'relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_34px_100px_-60px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-3xl';
const AUX_PANEL_CLASS =
  'relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] shadow-[0_34px_100px_-60px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-3xl';
const PROXY_PANEL_CLASS =
  'relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] shadow-[0_34px_100px_-60px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-3xl';
const isCinemetaManifestUrl = (value: string) => {
  try {
    return /(^|[-.])cinemeta\.strem\.io$/i.test(new URL(value).hostname);
  } catch {
    return false;
  }
};

export function WorkspacePageView({ refs, state, derived, actions }: HomePageViewProps) {
  const { navRef } = refs;
  const {
    previewType,
    mediaId,
    lang,
    posterLang,
    posterAnimeLang,
    backdropLang,
    backdropAnimeLang,
    logoLang,
    logoAnimeLang,
    posterAnimeImageText,
    backdropAnimeImageText,
    supportedLanguages,
    tmdbKey,
    mdblistKey,
    simklClientId,
    proxyManifestUrl,
    proxyCatalogs,
    proxyCatalogNames,
    proxyHiddenCatalogs,
    proxySearchDisabledCatalogs,
    proxyDiscoverOnlyCatalogs,
    proxyCatalogsStatus,
    proxyCatalogsError,
    proxySeriesMetadataProvider,
    proxyAiometadataProvider,
    proxyEnabledTypes,
    proxyTranslateMeta,
    exportStatus,
    importStatus,
    importMessage,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    logoRatingsMax,
    logoMode,
    logoFontVariant,
    logoCustomPrimary,
    logoCustomSecondary,
    logoCustomOutline,
    backdropRatingsLayout,
    backdropRatingsSize,
    thumbnailRatingsLayout,
    posterVerticalBadgeContent,
    backdropVerticalBadgeContent,
    thumbnailVerticalBadgeContent,
    thumbnailSize,
    qualityBadgesSide,
    posterQualityBadgesPosition,
    proxyCopied,
    copied,
    aiometadataCopiedType,
    aiometadataEpisodeProvider,
  } = state;
  const {
    baseUrl,
    previewUrl,
    proxyUrl,
    previewNotice,
    canGenerateProxy,
    isProxyUrlVisible,
    displayedProxyUrl,
    styleLabel,
    textLabel,
    providersLabel,
    activeRatingStyle,
    activeImageText,
    ratingProviderRows,
    shouldShowQualityBadgesPosition,
    shouldShowQualityBadgesSide,
    qualityBadgeTypeLabel,
    activeStreamBadges,
    activeQualityBadgesStyle,
    aiometadataPatterns,
  } = derived;
  const {
    handleExportConfig,
    handleImportFile,
    handleImportConfigString,
    handleCopyProxy,
    handleCopyPrompt,
    handleCopyAiometadataPattern,
    setPreviewType,
    setMediaId,
    setLang,
    setPosterLang,
    setPosterAnimeLang,
    setBackdropLang,
    setBackdropAnimeLang,
    setLogoLang,
    setLogoAnimeLang,
    setPosterAnimeImageText,
    setBackdropAnimeImageText,
    setTmdbKey,
    setMdblistKey,
    setSimklClientId,
    setPosterRatingsLayout,
    setPosterRatingsMaxPerSide,
    setLogoRatingsMax,
    setLogoMode,
    setLogoFontVariant,
    setLogoCustomPrimary,
    setLogoCustomSecondary,
    setLogoCustomOutline,
    setBackdropRatingsLayout,
    setBackdropRatingsSize,
    setThumbnailRatingsLayout,
    setPosterVerticalBadgeContent,
    setBackdropVerticalBadgeContent,
    setThumbnailVerticalBadgeContent,
    setThumbnailSize,
    setAiometadataEpisodeProvider,
    setProxySeriesMetadataProvider,
    setProxyAiometadataProvider,
    setPosterQualityBadgesPosition,
    setQualityBadgesSide,
    setRatingStyleForType,
    setImageTextForType,
    setActiveStreamBadges,
    setActiveQualityBadgesStyle,
    toggleRatingPreference,
    enableAllRatingPreferences,
    disableAllRatingPreferences,
    reorderRatingPreference,
    updateProxyManifestUrl,
    updateProxyCatalogName,
    toggleProxyCatalogHidden,
    toggleProxyCatalogSearchDisabled,
    setProxyCatalogDiscoverOnly,
    resetProxyCatalogCustomizations,
    toggleProxyEnabledType,
    toggleProxyTranslateMeta,
    toggleProxyUrlVisibility,
    handleTokenDisconnect,
    handleSaveConfig,
  } = actions;
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAiometadataModalOpen, setIsAiometadataModalOpen] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [rotatePassword, setRotatePassword] = useState('');
  const [rotateShowPassword, setRotateShowPassword] = useState(false);
  const [rotateStatus, setRotateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [rotateMessage, setRotateMessage] = useState('');
  const [rotatedNewToken, setRotatedNewToken] = useState('');
  const [rotateCopied, setRotateCopied] = useState(false);

  const handleRotateToken = async () => {
    if (!rotatePassword) {
      setRotateStatus('error');
      setRotateMessage('Enter the current token password.');
      return;
    }
    setRotateStatus('loading');
    setRotateMessage('');
    try {
      const res = await fetch('/api/workspace-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate-token', password: rotatePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rotation failed');

      const newToken: string = data.newToken;
      setRotatedNewToken(newToken);
      setRotateStatus('success');

      // Update localStorage
      window.localStorage.setItem('erdb_active_token', newToken);
    } catch (err: any) {
      setRotateStatus('error');
      setRotateMessage(err?.message || 'Error during token rotation');
    }
  };

  const handleCopyRotatedToken = async () => {
    await navigator.clipboard.writeText(rotatedNewToken);
    setRotateCopied(true);
    setTimeout(() => setRotateCopied(false), 2000);
  };

  const handleCloseRotateModal = async () => {
    const wasSuccess = rotateStatus === 'success';
    const tokenToSave = rotatedNewToken;
    const passwordToSave = rotatePassword;

    setIsRotateModalOpen(false);
    setRotatePassword('');
    setRotateShowPassword(false);
    setRotateStatus('idle');
    setRotateMessage('');
    setRotatedNewToken('');
    setRotateCopied(false);

    if (wasSuccess && tokenToSave && passwordToSave) {
      // Called directly within a user gesture (button click) so the browser
      // can reliably show the "Update saved password?" prompt.
      const passwordCredentialCtor = (window as Window & {
        PasswordCredential?: new (data: { id: string; name?: string; password: string }) => Credential;
      }).PasswordCredential;
      if ('credentials' in navigator && passwordCredentialCtor) {
        try {
          const credential = new passwordCredentialCtor({
            id: tokenToSave,
            name: 'ERDB Token Account',
            password: passwordToSave,
          });
          await navigator.credentials.store(credential);
        } catch {
          // Some browsers block credential storage silently
        }
      }

      // Hidden form fallback: browsers that need an actual form submission
      // to trigger their password manager (e.g. Chrome in some configurations).
      // The form submits to a GET page so no data payload reaches the server.
      const form = document.createElement('form');
      form.method = 'get';
      form.action = '/configurator';
      form.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';

      const usernameInput = document.createElement('input');
      usernameInput.type = 'text';
      usernameInput.name = 'u';
      usernameInput.setAttribute('autocomplete', 'username');
      usernameInput.value = tokenToSave;

      const passwordInput = document.createElement('input');
      passwordInput.type = 'password';
      passwordInput.name = 'p';
      passwordInput.setAttribute('autocomplete', 'current-password');
      passwordInput.value = passwordToSave;

      form.appendChild(usernameInput);
      form.appendChild(passwordInput);
      document.body.appendChild(form);
      form.submit(); // real navigation — browser sees credentials and offers to save
      return; // navigation handles the reload
    } else if (wasSuccess) {
      window.location.reload();
    }
  };
  const shouldShowVerticalBadgeContent =
    (previewType === 'poster' && isVerticalPosterRatingLayout(posterRatingsLayout)) ||
    (previewType === 'backdrop' && backdropRatingsLayout === 'right-vertical') ||
    (previewType === 'thumbnail' && thumbnailRatingsLayout.endsWith('-vertical'));
  const activeVerticalBadgeContent =
    previewType === 'poster' ? posterVerticalBadgeContent : previewType === 'thumbnail' ? thumbnailVerticalBadgeContent : backdropVerticalBadgeContent;
  const normalizedProxyManifestUrl = proxyManifestUrl.trim().toLowerCase();
  const isAiometadataProxyManifest = normalizedProxyManifestUrl.includes('aiometadata');
  const isCinemetaProxyManifest = isCinemetaManifestUrl(proxyManifestUrl.trim());
  const canConfigureCatalogs =
    Boolean(normalizedProxyManifestUrl) &&
    normalizedProxyManifestUrl !== 'http://' &&
    normalizedProxyManifestUrl !== 'https://';
  const isCatalogModalVisible = isCatalogModalOpen && canConfigureCatalogs;
  const isAiometadataModalVisible = isAiometadataModalOpen;
  const isAnyModalVisible = isCatalogModalVisible || isAiometadataModalVisible;
  const customizedCatalogCount = Object.keys(proxyCatalogNames).length;
  const hiddenCatalogCount = proxyHiddenCatalogs.length;
  const searchDisabledCatalogCount = proxySearchDisabledCatalogs.length;
  const discoverOnlyOverrideCount = Object.keys(proxyDiscoverOnlyCatalogs).length;
  const discoverOnlyCatalogCount = proxyCatalogs.filter(
    (catalog) => (proxyDiscoverOnlyCatalogs[catalog.key] ?? catalog.discoverOnly) === true
  ).length;
  const hasCatalogCustomizations =
    customizedCatalogCount > 0 ||
    hiddenCatalogCount > 0 ||
    searchDisabledCatalogCount > 0 ||
    discoverOnlyOverrideCount > 0;

  useEffect(() => {
    if (!isAnyModalVisible) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isAiometadataModalVisible) {
          setIsAiometadataModalOpen(false);
          return;
        }
        setIsCatalogModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiometadataModalVisible, isAnyModalVisible]);

  useEffect(() => {
    if (!isAnyModalVisible) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';
    document.documentElement.style.overscrollBehavior = 'contain';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [isAnyModalVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280 && window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    window.addEventListener('resize', handleResize);
    // Execute once on mount in case the page loaded with restored scroll
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHorizontalScrollWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const hasHorizontalOverflow = container.scrollWidth > container.clientWidth;

    if (!hasHorizontalOverflow) {
      return;
    }

    const scrollDelta = event.deltaX !== 0 ? event.deltaX : event.deltaY;

    if (scrollDelta === 0) {
      return;
    }

    event.preventDefault();
    container.scrollLeft += scrollDelta;
  };

  const handlePasteOldConfigString = () => {
    const pastedValue = window.prompt('Paste an old ERDB configuration or a proxy URL');
    if (!pastedValue?.trim()) {
      return;
    }

    handleImportConfigString(pastedValue);
  };

  return (
    <>
    <div className="relative min-h-screen bg-[#06070b] text-slate-200 selection:bg-orange-400/30 font-[var(--font-body)] xl:h-screen xl:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),_transparent_60%)] blur-3xl" />
        <div className="absolute right-[-220px] top-40 h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.12),_transparent_60%)] blur-3xl" />
        <div className="absolute left-[-180px] bottom-[-140px] h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(20,184,166,0.12),_transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.025),_rgba(255,255,255,0)_40%,_rgba(255,255,255,0.02)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1840px] flex-col px-3 py-3 sm:px-4 sm:py-4 xl:h-full xl:min-h-0">
        <nav ref={navRef} className="z-50 rounded-[28px] border border-white/10 bg-[#06070b]/72 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
          <div className="mx-auto grid w-full grid-cols-1 gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-4">
            {/* Left: nav links */}
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.07] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Home</Link>
              <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-2 text-white">Workspace</span>
              <Link href="/docs" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.07] hover:text-white">API Docs</Link>
            </div>
            {/* Center: Type + Media ID + Lang */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Type</span>
                <div className={`${SEGMENT_CLASS} flex-wrap p-0.5 xl:flex-nowrap`}>
                  {(['poster', 'backdrop', 'logo', 'thumbnail'] as const).map(type => (
                    <button key={type} onClick={() => setPreviewType(type)} className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${previewType === type ? 'border border-orange-400/20 bg-orange-500/10 text-white' : 'border border-transparent text-slate-400 hover:text-white'}`}>
                      {type === 'poster' && <ImageIcon className="w-3 h-3" />}
                      {type === 'backdrop' && <MonitorPlay className="w-3 h-3" />}
                      {type === 'logo' && <Layers className="w-3 h-3" />}
                      {type === 'thumbnail' && <MonitorPlay className="w-3 h-3" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Media ID</span>
                <input
                  type="text"
                  value={mediaId}
                  onChange={(e) => setMediaId(e.target.value)}
                  placeholder={previewType === 'thumbnail' ? 'tt0944947:1:1' : 'tt0133093'}
                  className={`h-8 w-40 ${INPUT_COMPACT_CLASS}`}
                />
              </div>
              {tmdbKey ? (
                <div className="flex items-center gap-2">
                  <span className="flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500"><Globe2 className="w-3 h-3" /> Lang</span>
                  <div className="relative">
                    <select value={lang} onChange={(e) => setLang(e.target.value)} className={`h-8 w-40 appearance-none pr-7 ${INPUT_COMPACT_CLASS}`}>
                      {supportedLanguages.map((language) => (
                        <option key={language.code} value={language.code} className="bg-[#0a0a0a]">
                          {language.flag} {language.label}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-2 top-2.5 w-3 h-3 rotate-90 stroke-2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500"><Globe2 className="w-3 h-3" /> Lang</span>
                  <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#080808] px-2 py-1.5 text-[10px] text-slate-500">
                    <Globe2 className="w-3 h-3 shrink-0" /> Add TMDB key
                  </div>
                </div>
              )}
            </div>
            {/* Right: Rotate Token / Disconnect / Login */}
             <div className="flex items-center gap-2">
              {state.activeToken && (
                <button
                  onClick={handleSaveConfig}
                  disabled={state.configSaveStatus === 'saving'}
                  className={`rounded-full border px-3 py-2 text-[10px] transition-colors inline-flex items-center gap-1.5 ${
                    state.configSaveStatus === 'saved'
                      ? 'border-green-400/30 bg-green-500/15 text-green-200'
                      : state.configSaveStatus === 'error'
                        ? 'border-red-400/30 bg-red-500/15 text-red-200'
                        : state.configSaveStatus === 'saving'
                          ? 'border-orange-400/20 bg-orange-500/10 text-orange-200 cursor-wait'
                          : 'border-orange-400/20 bg-orange-500/10 text-white hover:bg-orange-500/20'
                  }`}
                  title="Save current configuration to token"
                >
                  {state.configSaveStatus === 'saved' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  <span>
                    {state.configSaveStatus === 'saving'
                      ? 'Saving…'
                      : state.configSaveStatus === 'saved'
                        ? 'Saved'
                        : state.configSaveStatus === 'error'
                          ? 'Error'
                          : 'Save Config'}
                  </span>
                </button>
              )}
              {state.activeToken && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(state.activeToken!);
                    setTokenCopied(true);
                    setTimeout(() => setTokenCopied(false), 2000);
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-white inline-flex items-center gap-1.5"
                  title="Copia il Token negli appunti"
                >
                  {tokenCopied ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Clipboard className="h-3 w-3" />
                  )}
                  <span className={tokenCopied ? "text-green-400" : ""}>
                    {tokenCopied ? 'Copied' : 'Copy Token'}
                  </span>
                </button>
              )}
              {state.activeToken && (
                <button
                  onClick={() => setIsRotateModalOpen(true)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-white inline-flex items-center gap-1.5"
                  title="Genera un nuovo token migrando la configurazione"
                >
                  <RefreshCcw className="h-3 w-3" />
                  <span>Rotate Token</span>
                </button>
              )}
              {state.activeToken && (
                <button
                  onClick={actions.handleTokenDisconnect}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] text-slate-100 transition-colors hover:bg-white/10 inline-flex items-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              )}
              {!state.activeToken && (
                <Link
                  href="/configurator"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] text-slate-100 transition-colors hover:bg-white/10 inline-flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="mx-auto flex w-full flex-col pb-6 pt-3 xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:pb-0">
          {/* Live Previewer */}
          <section id="preview" className="relative flex flex-col overflow-visible xl:min-h-0 xl:flex-1 xl:overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 gap-4 xl:premium-scrollbar xl:min-h-0 xl:flex-1 xl:overflow-hidden xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1.28fr)_minmax(0,0.88fr)] xl:items-stretch">
              {/* Controls */}
              <div className="min-w-0 w-full flex flex-col gap-3 xl:self-stretch xl:premium-scrollbar xl:min-h-0 xl:h-full xl:overflow-y-auto xl:pr-1">
                <div className={`${CONFIG_PANEL_CLASS} shrink-0 space-y-3 p-4`}>
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-100">
                      <Settings2 className="h-3.5 w-3.5" />
                      <span>Configurator</span>
                    </div>
                    <p className="text-xs text-slate-400">Adjust parameters and update the live preview in real time.</p>
                  </div>
                  <div className={`${INNER_PANEL_CLASS} p-3 space-y-3`}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Access Keys</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">TMDB</label>
                        <input type="password" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} placeholder="v3 Key" className={INPUT_CLASS} />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">MDBList</label>
                        <input type="password" value={mdblistKey} onChange={(e) => setMdblistKey(e.target.value)} placeholder="Key" className={INPUT_CLASS} />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">SIMKL</label>
                        <input type="password" value={simklClientId} onChange={(e) => setSimklClientId(e.target.value)} placeholder="client_id (optional)" className={INPUT_CLASS} />
                      </div>
                    </div>
                  </div>

                  {previewType === 'poster' && tmdbKey && (
                    <div className={`${INNER_PANEL_CLASS} p-3 space-y-3`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Poster Language</div>
                      <div className="relative max-w-[220px]">
                        <select value={posterLang} onChange={(e) => setPosterLang(e.target.value)} className={`h-8 w-full appearance-none pr-7 ${INPUT_COMPACT_CLASS}`}>
                          <option value="" className="bg-[#0a0a0a]">Global ({lang})</option>
                          <option value="original" className="bg-[#0a0a0a]">Native Language</option>
                          {supportedLanguages.map((language) => (
                            <option key={language.code} value={language.code} className="bg-[#0a0a0a]">
                              {language.flag} {language.label}
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-2 top-2.5 w-3 h-3 rotate-90 stroke-2 text-slate-500 pointer-events-none" />
                      </div>
                      <div>
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Poster Language Anime</div>
                        <div className="relative max-w-[220px]">
                          <select value={posterAnimeLang} onChange={(e) => setPosterAnimeLang(e.target.value)} className={`h-8 w-full appearance-none pr-7 ${INPUT_COMPACT_CLASS}`}>
                            <option value="" className="bg-[#0a0a0a]">Global ({lang})</option>
                            <option value="original" className="bg-[#0a0a0a]">Native Language</option>
                            {supportedLanguages.map((language) => (
                              <option key={language.code} value={language.code} className="bg-[#0a0a0a]">
                                {language.flag} {language.label}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-2 top-2.5 w-3 h-3 rotate-90 stroke-2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {previewType === 'backdrop' && tmdbKey && (
                    <div className={`${INNER_PANEL_CLASS} p-3 space-y-3`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Backdrop Language</div>
                      <div className="relative max-w-[220px]">
                        <select value={backdropLang} onChange={(e) => setBackdropLang(e.target.value)} className={`h-8 w-full appearance-none pr-7 ${INPUT_COMPACT_CLASS}`}>
                          <option value="" className="bg-[#0a0a0a]">Global ({lang})</option>
                          <option value="original" className="bg-[#0a0a0a]">Native Language</option>
                          {supportedLanguages.map((language) => (
                            <option key={language.code} value={language.code} className="bg-[#0a0a0a]">
                              {language.flag} {language.label}
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-2 top-2.5 w-3 h-3 rotate-90 stroke-2 text-slate-500 pointer-events-none" />
                      </div>
                      <div>
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Backdrop Language Anime</div>
                        <div className="relative max-w-[220px]">
                          <select value={backdropAnimeLang} onChange={(e) => setBackdropAnimeLang(e.target.value)} className={`h-8 w-full appearance-none pr-7 ${INPUT_COMPACT_CLASS}`}>
                            <option value="" className="bg-[#0a0a0a]">Global ({lang})</option>
                            <option value="original" className="bg-[#0a0a0a]">Native Language</option>
                            {supportedLanguages.map((language) => (
                              <option key={language.code} value={language.code} className="bg-[#0a0a0a]">
                                {language.flag} {language.label}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-2 top-2.5 w-3 h-3 rotate-90 stroke-2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {previewType === 'logo' && tmdbKey && (
                    <div className={`${INNER_PANEL_CLASS} p-3 space-y-3`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Logo Language</div>
                      <div className="relative max-w-[220px]">
                        <select value={logoLang} onChange={(e) => setLogoLang(e.target.value)} className={`h-8 w-full appearance-none pr-7 ${INPUT_COMPACT_CLASS}`}>
                          <option value="" className="bg-[#0a0a0a]">Global ({lang})</option>
                          <option value="original" className="bg-[#0a0a0a]">Native Language</option>
                          {supportedLanguages.map((language) => (
                            <option key={language.code} value={language.code} className="bg-[#0a0a0a]">
                              {language.flag} {language.label}
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-2 top-2.5 w-3 h-3 rotate-90 stroke-2 text-slate-500 pointer-events-none" />
                      </div>
                      <div>
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Logo Language Anime</div>
                        <div className="relative max-w-[220px]">
                          <select value={logoAnimeLang} onChange={(e) => setLogoAnimeLang(e.target.value)} className={`h-8 w-full appearance-none pr-7 ${INPUT_COMPACT_CLASS}`}>
                            <option value="" className="bg-[#0a0a0a]">Global ({lang})</option>
                            <option value="original" className="bg-[#0a0a0a]">Native Language</option>
                            {supportedLanguages.map((language) => (
                              <option key={language.code} value={language.code} className="bg-[#0a0a0a]">
                                {language.flag} {language.label}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-2 top-2.5 w-3 h-3 rotate-90 stroke-2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`${INNER_PANEL_CLASS} p-3 space-y-3`}>
                    <div className="flex flex-wrap gap-3 items-center">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">{styleLabel}</span>
                        <div className={SEGMENT_CLASS}>
                          {RATING_STYLE_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setRatingStyleForType(opt.id as RatingStyle)} className={`px-2 py-1 rounded text-xs font-bold transition-all ${activeRatingStyle === opt.id ? 'border border-orange-400/20 bg-orange-500/10 text-white' : 'border border-transparent text-slate-400 hover:text-white'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      {previewType !== 'logo' && previewType !== 'thumbnail' && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">{textLabel}</span>
                          <div className={SEGMENT_CLASS}>
                            {(['default', 'clean', 'alternative'] as const).map(option => (
                              <button key={option} onClick={() => setImageTextForType(option)} className={`px-2 py-1 rounded text-xs font-bold transition-all ${activeImageText === option ? 'border border-orange-400/20 bg-orange-500/10 text-white' : 'border border-transparent text-slate-400 hover:text-white'}`}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>
                            ))}
                          </div>
                          {previewType === 'poster' && (
                            <div className="mt-3">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Poster Text Anime</span>
                              <div className={SEGMENT_CLASS}>
                                {(['default', 'clean', 'alternative'] as const).map(option => (
                                  <button key={option} onClick={() => setPosterAnimeImageText(option)} className={`px-2 py-1 rounded text-xs font-bold transition-all ${posterAnimeImageText === option ? 'border border-orange-400/20 bg-orange-500/10 text-white' : 'border border-transparent text-slate-400 hover:text-white'}`}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          {previewType === 'backdrop' && (
                            <div className="mt-3">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Backdrop Text Anime</span>
                              <div className={SEGMENT_CLASS}>
                                {(['default', 'clean', 'alternative'] as const).map(option => (
                                  <button key={option} onClick={() => setBackdropAnimeImageText(option)} className={`px-2 py-1 rounded text-xs font-bold transition-all ${backdropAnimeImageText === option ? 'border border-orange-400/20 bg-orange-500/10 text-white' : 'border border-transparent text-slate-400 hover:text-white'}`}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {previewType === 'poster' && (
                    <div className={`${INNER_PANEL_CLASS} p-3 space-y-2`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Poster Layout</div>
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {POSTER_RATING_LAYOUT_OPTIONS.map(opt => (
                              <button key={opt.id} onClick={() => setPosterRatingsLayout(opt.id as PosterRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${posterRatingsLayout === opt.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>{opt.label}</button>
                            ))}
                          </div>
                        </div>
                        {isVerticalPosterRatingLayout(posterRatingsLayout) && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Max/side</span>
                            <input type="number" value={posterRatingsMaxPerSide ?? ''} onChange={(e) => setPosterRatingsMaxPerSide(e.target.value === '' ? null : parseInt(e.target.value))} placeholder="Auto" className={`w-16 ${INPUT_COMPACT_CLASS}`} />
                            <button onClick={() => setPosterRatingsMaxPerSide(null)} className="rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-[11px] text-slate-300 hover:bg-[#121212]">Auto</button>
                          </div>
                        )}
                      </div>
                      {shouldShowVerticalBadgeContent && (
                        <div className="pt-1 space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Vertical Badge Content</div>
                          <div className="flex flex-wrap gap-1">
                            {VERTICAL_BADGE_CONTENT_OPTIONS.map(option => (
                              <button key={option.id} onClick={() => setPosterVerticalBadgeContent(option.id)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${activeVerticalBadgeContent === option.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-500">For vertical layouts, keep badges standard or stack icon and value vertically.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {previewType === 'backdrop' && (
                    <div className={`${INNER_PANEL_CLASS} p-3 space-y-2`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Backdrop Layout</div>
                      <div className="flex flex-wrap gap-1">
                        {BACKDROP_RATING_LAYOUT_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => setBackdropRatingsLayout(opt.id as BackdropRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${backdropRatingsLayout === opt.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>{opt.label}</button>
                        ))}
                      </div>
                      <div className="pt-1">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Backdrop Ratings Size</div>
                        <div className="flex flex-wrap gap-1">
                          {BACKDROP_RATINGS_SIZE_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setBackdropRatingsSize(opt.id as BackdropRatingsSize)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${backdropRatingsSize === opt.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      {shouldShowVerticalBadgeContent && (
                        <div className="pt-1 space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Vertical Badge Content</div>
                          <div className="flex flex-wrap gap-1">
                            {VERTICAL_BADGE_CONTENT_OPTIONS.map(option => (
                              <button key={option.id} onClick={() => setBackdropVerticalBadgeContent(option.id)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${activeVerticalBadgeContent === option.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-500">For vertical layouts, keep badges standard or stack icon and value vertically.</div>
                        </div>
                      )}
                    </div>
                  )}
                  {previewType === 'thumbnail' && (
                    <div className={`${INNER_PANEL_CLASS} p-3 space-y-2`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Thumbnail Layout</div>
                      <div className="flex flex-wrap gap-1">
                        {THUMBNAIL_RATING_LAYOUT_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => setThumbnailRatingsLayout(opt.id as ThumbnailRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${thumbnailRatingsLayout === opt.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>{opt.label}</button>
                        ))}
                      </div>
                      <div className="pt-1">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Thumbnail Size</div>
                        <div className="flex flex-wrap gap-1">
                          {THUMBNAIL_SIZE_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setThumbnailSize(opt.id as ThumbnailSize)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${thumbnailSize === opt.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      {shouldShowVerticalBadgeContent && (
                        <div className="pt-1 space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Vertical Badge Content</div>
                          <div className="flex flex-wrap gap-1">
                            {VERTICAL_BADGE_CONTENT_OPTIONS.map(option => (
                              <button key={option.id} onClick={() => setThumbnailVerticalBadgeContent(option.id)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${activeVerticalBadgeContent === option.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-500">For vertical layouts, keep badges standard or stack icon and value vertically.</div>
                        </div>
                      )}
                    </div>
                  )}
                  {previewType === 'logo' && (
                    <div className={`${INNER_PANEL_CLASS} p-3 space-y-2`}>
                      <div>
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Logo Mode</div>
                        <div className="flex flex-wrap gap-1">
                          {LOGO_MODE_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => setLogoMode(option.id)}
                              className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${logoMode === option.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {logoMode === 'custom-logo' && (
                        <div className="space-y-3">
                          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Logo Font</div>
                          <div className="flex flex-wrap gap-1">
                            {LOGO_FONT_VARIANT_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => setLogoFontVariant(option.id)}
                                className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${logoFontVariant === option.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div className="grid gap-3 lg:grid-cols-3">
                            <label className="space-y-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Primary</span>
                              <div className="flex min-w-0 items-center gap-2">
                                <input
                                  type="color"
                                  value={logoCustomPrimary}
                                  onChange={(e) => setLogoCustomPrimary(e.target.value)}
                                  className="h-9 w-14 shrink-0 cursor-pointer rounded border border-white/10 bg-[#0a0a0a] p-1"
                                />
                                <input
                                  type="text"
                                  value={logoCustomPrimary}
                                  onChange={(e) => setLogoCustomPrimary(e.target.value)}
                                  className={`min-w-0 flex-1 ${INPUT_COMPACT_CLASS}`}
                                />
                              </div>
                            </label>
                            <label className="space-y-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Secondary</span>
                              <div className="flex min-w-0 items-center gap-2">
                                <input
                                  type="color"
                                  value={logoCustomSecondary}
                                  onChange={(e) => setLogoCustomSecondary(e.target.value)}
                                  className="h-9 w-14 shrink-0 cursor-pointer rounded border border-white/10 bg-[#0a0a0a] p-1"
                                />
                                <input
                                  type="text"
                                  value={logoCustomSecondary}
                                  onChange={(e) => setLogoCustomSecondary(e.target.value)}
                                  className={`min-w-0 flex-1 ${INPUT_COMPACT_CLASS}`}
                                />
                              </div>
                            </label>
                            <label className="space-y-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Outline</span>
                              <div className="flex min-w-0 items-center gap-2">
                                <input
                                  type="color"
                                  value={logoCustomOutline}
                                  onChange={(e) => setLogoCustomOutline(e.target.value)}
                                  className="h-9 w-14 shrink-0 cursor-pointer rounded border border-white/10 bg-[#0a0a0a] p-1"
                                />
                                <input
                                  type="text"
                                  value={logoCustomOutline}
                                  onChange={(e) => setLogoCustomOutline(e.target.value)}
                                  className={`min-w-0 flex-1 ${INPUT_COMPACT_CLASS}`}
                                />
                              </div>
                            </label>
                          </div>
                          <div className="space-y-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Color Presets</div>
                            <div className="flex flex-wrap gap-1">
                              {LOGO_COLOR_PRESETS.map((preset) => (
                                <button
                                  key={preset.id}
                                  onClick={() => {
                                    setLogoCustomPrimary(preset.primary);
                                    setLogoCustomSecondary(preset.secondary);
                                    setLogoCustomOutline(preset.outline);
                                  }}
                                  className="rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-[11px] font-bold text-slate-300 transition-all hover:text-white"
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.outline }} />
                                    <span>{preset.label}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setLogoCustomPrimary(DEFAULT_LOGO_CUSTOM_PRIMARY);
                                setLogoCustomSecondary(DEFAULT_LOGO_CUSTOM_SECONDARY);
                                setLogoCustomOutline(DEFAULT_LOGO_CUSTOM_OUTLINE);
                              }}
                              className="rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-[11px] text-slate-300 hover:bg-[#121212]"
                            >
                              Reset Colors
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Logo Ratings</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Max badges</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={logoRatingsMax ?? ''}
                          onChange={(e) => setLogoRatingsMax(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                          placeholder="Auto"
                          className={`w-16 ${INPUT_COMPACT_CLASS}`}
                        />
                        <button
                          onClick={() => setLogoRatingsMax(null)}
                          className="rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-[11px] text-slate-300 hover:bg-[#121212]"
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  )}

                  {previewType !== 'logo' && previewType !== 'thumbnail' && (
                    <div className={`${INNER_PANEL_CLASS} p-3 space-y-2`}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Quality Badges - {qualityBadgeTypeLabel}
                      </div>
                      <div className={SEGMENT_CLASS}>
                        {STREAM_BADGE_OPTIONS.map(option => (
                          <button key={option.id} onClick={() => setActiveStreamBadges(option.id)} className={`px-2 py-1 rounded text-xs font-bold transition-all ${activeStreamBadges === option.id ? 'border border-orange-400/20 bg-orange-500/10 text-white' : 'border border-transparent text-slate-400 hover:text-white'}`}>
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Quality Badge Style</span>
                        <div className="flex flex-wrap gap-1">
                          {RATING_STYLE_OPTIONS.map(option => (
                            <button key={`quality-style-${option.id}`} onClick={() => setActiveQualityBadgesStyle(option.id)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${activeQualityBadgesStyle === option.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {shouldShowQualityBadgesPosition && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Side</span>
                          <div className={SEGMENT_CLASS}>
                            {POSTER_QUALITY_BADGE_POSITION_OPTIONS.map(option => (
                              <button key={option.id} onClick={() => setPosterQualityBadgesPosition(option.id)} className={`px-2 py-1 rounded text-xs font-bold transition-all ${posterQualityBadgesPosition === option.id ? 'border border-orange-400/20 bg-orange-500/10 text-white' : 'border border-transparent text-slate-400 hover:text-white'}`}>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {shouldShowQualityBadgesSide && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Side</span>
                          <div className={SEGMENT_CLASS}>
                            {QUALITY_BADGE_SIDE_OPTIONS.map(option => (
                              <button key={option.id} onClick={() => setQualityBadgesSide(option.id)} className={`px-2 py-1 rounded text-xs font-bold transition-all ${qualityBadgesSide === option.id ? 'border border-orange-400/20 bg-orange-500/10 text-white' : 'border border-transparent text-slate-400 hover:text-white'}`}>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`${INNER_PANEL_CLASS} p-3 space-y-2`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {providersLabel} - drag the grip to reorder (left to right / top to bottom)
                        </span>
                        <span className="block text-[10px] text-slate-500/80">
                          Order flows top to bottom, then continues in the right column.
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={enableAllRatingPreferences}
                          className="rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-[#121212]"
                        >
                          Enable all
                        </button>
                        <button
                          type="button"
                          onClick={disableAllRatingPreferences}
                          className="rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-[#121212]"
                        >
                          Disable all
                        </button>
                      </div>
                    </div>
                    <RatingProviderSortableList
                      rows={ratingProviderRows}
                      onReorder={reorderRatingPreference}
                      onToggle={toggleRatingPreference}
                      fillDirection="column"
                      singleColumnOnMobile
                    />
                  </div>
                </div>

              </div>

              <div className="min-w-0 w-full flex flex-col gap-5 xl:self-stretch xl:premium-scrollbar xl:min-h-0 xl:h-full xl:overflow-y-auto xl:pr-1">
                <div className={`${PREVIEW_PANEL_CLASS} flex min-h-0 flex-col p-4 w-full xl:flex-1`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-100">
                      <MonitorPlay className="h-3.5 w-3.5" />
                      <span>Preview Output</span>
                    </div>
                    <p className="text-[11px] text-slate-400 sm:text-xs">
                      All ratings are normalized to a 0-10 scale.
                    </p>
                  </div>
                  <div className={`relative mt-4 flex min-h-[340px] flex-1 items-center justify-center xl:min-h-0 ${previewType === 'poster' ? 'xl:mx-auto xl:max-w-[28rem]' : previewType === 'logo' ? 'xl:mx-auto xl:max-w-[56rem]' : ''}`}>
                    {previewNotice ? (
                      <div className="relative z-10 max-w-md text-center">
                        <div className="text-sm font-semibold text-orange-300">{previewNotice}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          Use an episode ID in the format `imdb_id:season:episode`.
                        </div>
                      </div>
                    ) : previewUrl ? (
                      <div className="relative z-10 flex h-full min-h-0 w-full items-center justify-center p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-[#030303] shadow-[0_24px_70px_-35px_rgba(0,0,0,1)] ring-1 ring-white/8 ${
                            previewType === 'logo'
                              ? 'block w-full max-w-2xl h-auto'
                              : 'block max-w-full max-h-full w-auto h-auto'
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="relative z-10 text-sm text-slate-500">No preview available.</div>
                    )}
                  </div>
                </div>

              </div>

              <div className="min-w-0 w-full flex flex-col gap-3 xl:self-stretch xl:premium-scrollbar xl:min-h-0 xl:h-full xl:overflow-y-auto xl:pr-1">
                <div className={`${AUX_PANEL_CLASS} shrink-0 p-3 space-y-3`}>
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-100">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Aiometadata Patterns</span>
                    </div>
                    <p className="text-xs text-slate-400">Standalone helper for AiOMetadata URL patterns. It is separate from the addon proxy flow.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiometadataModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-[#121212]"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Open Patterns</span>
                  </button>
                </div>

                <div id="proxy" className={`${PROXY_PANEL_CLASS} shrink-0 scroll-mt-16 p-3 space-y-3`}>
                  <div>
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-100">
                        <Layers className="h-3.5 w-3.5" />
                        <span>Addon Proxy</span>
                      </div>
                      <p className="text-xs text-slate-400">Paste a Stremio addon manifest to generate a new manifest and choose which image types to replace.</p>
                    </div>
                  </div>

                  <div className={`${INNER_PANEL_CLASS} p-3 space-y-3`}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">ERDB Parameters</div>
                    <p className="text-[11px] text-slate-500">
                      Use the configurator above for keys, language, ratings, layout, badges, and text.
                    </p>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Manifest URL</label>
                      <input
                        type="url"
                        value={proxyManifestUrl}
                        onChange={(e) => updateProxyManifestUrl(e.target.value)}
                        placeholder="https://addon.example.com/manifest.json"
                        className={INPUT_CLASS}
                      />
                    </div>
                    {canConfigureCatalogs && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsCatalogModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-[#121212]"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Configure Catalogs</span>
                          </button>
                          {customizedCatalogCount > 0 && (
                            <div className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-semibold text-orange-200">
                              {customizedCatalogCount} custom name{customizedCatalogCount === 1 ? '' : 's'}
                            </div>
                          )}
                          {hiddenCatalogCount > 0 && (
                            <div className="rounded-full border border-white/10 bg-[#121212] px-2 py-1 text-[10px] font-semibold text-slate-300">
                              {hiddenCatalogCount} hidden
                            </div>
                          )}
                          {searchDisabledCatalogCount > 0 && (
                            <div className="rounded-full border border-white/10 bg-[#121212] px-2 py-1 text-[10px] font-semibold text-slate-300">
                              {searchDisabledCatalogCount} search off
                            </div>
                          )}
                          {discoverOnlyCatalogCount > 0 && (
                            <div className="rounded-full border border-white/10 bg-[#121212] px-2 py-1 text-[10px] font-semibold text-slate-300">
                              {discoverOnlyCatalogCount} discover only
                            </div>
                          )}
                        </div>
                        {proxyCatalogsStatus === 'loading' && (
                          <p className="text-[10px] text-slate-500">Loading catalogs from the source manifest...</p>
                        )}
                        {proxyCatalogsStatus === 'ready' && proxyCatalogs.length > 0 && customizedCatalogCount === 0 && (
                          <p className="text-[10px] text-slate-500">
                            {proxyCatalogs.length} catalog{proxyCatalogs.length === 1 ? '' : 's'} detected.
                          </p>
                        )}
                        {proxyCatalogsStatus === 'ready' && proxyCatalogs.length === 0 && (
                          <p className="text-[10px] text-slate-500">This manifest does not expose any catalogs.</p>
                        )}
                        {proxyCatalogsStatus === 'error' && (
                          <p className="text-[10px] text-red-300">{proxyCatalogsError}</p>
                        )}
                        <p className="text-[10px] text-slate-600">
                          Discover-only keeps the catalog available in Discover without showing it on the home rows.
                        </p>
                      </div>
                    )}
                    {canConfigureCatalogs && isCinemetaProxyManifest && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-500">Cinemeta uses IMDb IDs for series automatically, so ERDB will use <span className="text-slate-300 font-medium">`realimdb:`</span> for episode thumbnails without asking for a provider selection.</p>
                      </div>
                    )}
                    {canConfigureCatalogs && !isAiometadataProxyManifest && !isCinemetaProxyManifest && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">Addon Metadata Provider</span>
                          <div className="flex flex-wrap gap-1.5">
                            {PROXY_SERIES_METADATA_PROVIDER_OPTIONS.map((option) => (
                              <button
                                key={`proxy-series-provider-${option.id}`}
                                type="button"
                                onClick={() => setProxySeriesMetadataProvider(option.id)}
                                className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${proxySeriesMetadataProvider === option.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {isAiometadataProxyManifest && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-500">The proxy cannot reliably distinguish AIOMetadata series from anime in every case, so use the same provider for both. Select <span className="text-slate-300 font-medium">IMDb</span> if AIOMetadata uses IMDb as the meta provider for both series and anime, so ERDB can upgrade `tt...` IDs to `realimdb:`. Select <span className="text-slate-300 font-medium">TVDB</span> if AIOMetadata keeps IMDb `tt...` IDs but uses TVDB season and episode numbering for thumbnails: ERDB will bridge IMDb to TVDB aired order automatically when rendering episode thumbnails. Select <span className="text-slate-300 font-medium">Custom</span> to keep the addon IDs exactly as they are.</p>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">AiOMetadata Series/Anime Provider</span>
                          <div className="flex flex-wrap gap-1.5">
                            {PROXY_EPISODE_PROVIDER_OPTIONS.map((option) => (
                              <button
                                key={`proxy-provider-${option.id}`}
                                type="button"
                                onClick={() => setProxyAiometadataProvider(option.id)}
                                className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${proxyAiometadataProvider === option.id ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">Enabled Types</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PROXY_TYPES.map(type => (
                          <label key={`proxy-enabled-${type}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-bold cursor-pointer select-none transition-all ${proxyEnabledTypes[type] ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>
                            <input type="checkbox" checked={proxyEnabledTypes[type]} onChange={() => toggleProxyEnabledType(type)} className="h-3 w-3 accent-orange-500" />
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">Disabled types keep the original artwork.</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">Translate Meta</span>
                      <label className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-bold cursor-pointer select-none transition-all ${proxyTranslateMeta ? 'border-orange-400/20 bg-orange-500/10 text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}>
                        <input type="checkbox" checked={proxyTranslateMeta} onChange={toggleProxyTranslateMeta} className="h-3 w-3 accent-orange-500" />
                        <span>Translate Addon Content</span>
                      </label>
                      <div className="mt-1 text-[10px] text-slate-500">Uses selected language for titles, plots, and episodes.</div>
                    </div>
                  </div>

                  <div className={`${CODE_PANEL_CLASS} p-3`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-slate-400">Generated Manifest</div>
                      <button
                        type="button"
                        onClick={toggleProxyUrlVisibility}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors border border-white/10 bg-[#0a0a0a] text-slate-200 hover:bg-[#121212]"
                      >
                        {isProxyUrlVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isProxyUrlVisible ? 'HIDE' : 'SHOW'}</span>
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      Use this URL in Stremio. It ends with manifest.json and has no query params.
                    </p>
                    <div
                      className="mt-3 overflow-hidden rounded-xl bg-black/20 p-4 xl:premium-scrollbar xl:overflow-x-auto xl:overflow-y-hidden"
                      onWheel={handleHorizontalScrollWheel}
                    >
                      <div className={`w-full max-w-full break-all font-mono text-xs leading-5 text-slate-300 whitespace-normal xl:w-max xl:min-w-full xl:whitespace-nowrap ${!isProxyUrlVisible ? 'select-none' : ''}`}>
                        {displayedProxyUrl}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleCopyProxy}
                        disabled={!canGenerateProxy}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${canGenerateProxy ? (proxyCopied ? 'bg-green-500 text-white' : 'bg-orange-500 text-black hover:bg-orange-400') : 'bg-[#121212] text-slate-500 cursor-not-allowed'}`}
                      >
                        {proxyCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Clipboard className="w-3.5 h-3.5" />
                            <span>COPY LINK</span>
                          </>
                        )}
                      </button>
                      <a
                        href={canGenerateProxy ? proxyUrl : undefined}
                        target="_blank"
                        rel="noreferrer"
                        className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors ${canGenerateProxy ? 'border border-white/10 bg-[#0a0a0a] text-slate-200 hover:bg-[#121212]' : 'border border-white/5 bg-[#080808] text-slate-600 pointer-events-none'}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </a>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </section>

          <section className="hidden pb-20">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 md:p-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-slate-400">
                      <Code2 className="w-3.5 h-3.5 text-orange-400" />
                      <span>API Docs</span>
                    </div>
                    <h2 className="text-3xl font-[var(--font-display)] text-white">Documentation moved to its own page.</h2>
                    <p className="text-sm leading-7 text-slate-400">
                      The full renderer, proxy, helper endpoints, ID formats, and integration notes now live on the dedicated docs page so the homepage stays focused on configuration and previews.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/docs" className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-slate-100 transition-colors">
                      Open API Docs
                    </Link>
                    <a href="https://github.com/realbestia1/erdb" className="px-6 py-3 rounded-full border border-white/10 bg-white/[0.04] text-white font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2">
                      <span>View Repo</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {false && (
            <section id="docs" className="scroll-mt-16 pb-20">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-[var(--font-display)] text-white">Developers</h2>
                  <p className="text-slate-500">Stateless rendering for any media ID.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-6 bg-white/[0.04] border border-white/10 rounded-2xl space-y-3 hover:border-orange-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-orange-500" />
                    </div>
                    <h4 className="text-lg font-[var(--font-display)] text-white">Dynamic Rendering</h4>
                    <p className="text-sm text-slate-400">No tokens needed. Pass parameters in the query string and let ERDB handle metadata and rendering.</p>
                  </div>
                  <div className="p-6 bg-white/[0.04] border border-white/10 rounded-2xl space-y-3 hover:border-blue-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <h4 className="text-lg font-[var(--font-display)] text-white">Addon Friendly</h4>
                    <p className="text-sm text-slate-400">Perfect for Stremio, Kodi or any media center addon. Use simple URL patterns for easy integration in your code.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/10 bg-white/[0.04]">
                      <h3 className="text-lg font-[var(--font-display)] text-white flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-orange-500" /> API Reference
                      </h3>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[560px] text-sm">
                        <thead>
                          <tr className="bg-white/[0.04] text-[10px] uppercase tracking-widest font-bold text-slate-500">
                            <th className="px-5 py-2.5">Parameter</th>
                            <th className="px-5 py-2.5">Values</th>
                            <th className="px-5 py-2.5">Default</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">type <span className="text-slate-500">(path)</span></td>
                            <td className="px-5 py-2 text-slate-400 text-xs">poster, backdrop, logo, thumbnail</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">-</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">id <span className="text-slate-500">(path)</span></td>
                            <td className="px-5 py-2 text-slate-400 text-xs">IMDb, TMDB, Kitsu, etc.</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">-</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">ratings</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, simkl, myanimelist, anilist, kitsu (global fallback)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">all</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterRatings</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, simkl, myanimelist, anilist, kitsu (poster only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">all</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdropRatings</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, simkl, myanimelist, anilist, kitsu (backdrop only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">all</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">logoRatings</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, simkl, myanimelist, anilist, kitsu (logo only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">all</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">logoRatingsMax</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">1-20</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">lang</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">TMDB language codes, for example en, es-ES, es-MX, pt-PT, pt-BR</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">en</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">streamBadges</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">auto, on, off (global fallback)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterStreamBadges</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">auto, on, off (poster only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdropStreamBadges</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">auto, on, off (backdrop only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">qualityBadgesSide</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">left, right (poster top-bottom only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">left</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterQualityBadgesPosition</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">auto, left, right (poster top/bottom only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">qualityBadgesStyle</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">glass, square, plain (global fallback)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">glass</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterQualityBadgesStyle</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">glass, square, plain (poster only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">glass</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdropQualityBadgesStyle</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">glass, square, plain (backdrop only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">glass</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">ratingStyle</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">glass, square, plain</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">glass (poster/backdrop), plain (logo)</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">imageText</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">default, clean, alternative</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">default (poster), clean (backdrop)</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterRatingsLayout</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">top, bottom, left, right, top-bottom, left-right</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">top-bottom</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterRatingsMaxPerSide</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">1-20</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdropRatingsLayout</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">center, right-vertical</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">center</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">thumbnailRatingsLayout</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">center, center-top, center-bottom, center-vertical, left/right variants, vertical variants</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">center</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">thumbnailSize</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">small, medium, large</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">medium</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterVerticalBadgeContent / backdropVerticalBadgeContent / thumbnailVerticalBadgeContent</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">standard, stacked (vertical layouts only)</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">standard</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">tmdbKey <span className="font-bold">(req)</span></td>
                            <td className="px-5 py-2 text-slate-400 text-xs">TMDB v3 API Key</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">-</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">mdblistKey <span className="font-bold">(req)</span></td>
                            <td className="px-5 py-2 text-slate-400 text-xs">MDBList.com API Key</td>
                            <td className="px-5 py-2 text-slate-500 text-xs">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/10 bg-white/[0.04]">
                      <h3 className="text-lg font-[var(--font-display)] text-white flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-orange-500" /> Type Configs
                      </h3>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[680px] text-sm">
                        <thead>
                          <tr className="bg-white/[0.04] text-[10px] uppercase tracking-widest font-bold text-slate-500">
                            <th className="px-5 py-2.5">Type</th>
                            <th className="px-5 py-2.5">Config</th>
                            <th className="px-5 py-2.5">Layouts / Values</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">poster</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">
                              <div className="space-y-1">
                                <div>imageText</div>
                                <div>posterRatingsLayout</div>
                                <div>posterRatingsMaxPerSide</div>
                                <div>posterVerticalBadgeContent</div>
                              </div>
                            </td>
                            <td className="px-5 py-2 text-slate-400 text-xs">
                              <div className="space-y-1">
                                <div>default, clean, alternative</div>
                                <div>top, bottom, left, right, top-bottom, left-right</div>
                                <div>1-20 (auto if omitted)</div>
                                <div>standard, stacked (when using left/right vertical poster layouts)</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdrop</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">
                              <div className="space-y-1">
                                <div>imageText</div>
                                <div>backdropRatingsLayout</div>
                                <div>backdropVerticalBadgeContent</div>
                              </div>
                            </td>
                            <td className="px-5 py-2 text-slate-400 text-xs">
                              <div className="space-y-1">
                                <div>default, clean, alternative</div>
                                <div>center, right-vertical</div>
                                <div>standard, stacked (when using right-vertical)</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">thumbnail</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">
                              <div className="space-y-1">
                                <div>thumbnailRatingsLayout</div>
                                <div>thumbnailSize</div>
                                <div>thumbnailVerticalBadgeContent</div>
                              </div>
                            </td>
                            <td className="px-5 py-2 text-slate-400 text-xs">
                              <div className="space-y-1">
                                <div>thumbnail-specific layout options</div>
                                <div>small, medium, large</div>
                                <div>standard, stacked (when using a vertical thumbnail layout)</div>
                                <div>Uses episode stills and episode TMDB/IMDb ratings</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-mono text-orange-400 text-xs">logo</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">logoRatingsMax</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">1-20 (auto if omitted)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="px-5 pb-5 pt-3 text-[11px] text-slate-500">
                      Base params for all types: ratings (global fallback), lang, ratingStyle, tmdbKey, mdblistKey, simklClientId. Use `posterVerticalBadgeContent` for poster vertical layouts, `backdropVerticalBadgeContent` for backdrop vertical layouts, and `thumbnailVerticalBadgeContent` for thumbnail vertical layouts.
                    </div>
                  </div>

                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/10 bg-white/[0.04]">
                      <h3 className="text-lg font-[var(--font-display)] text-white flex items-center gap-2">
                        <Hash className="w-5 h-5 text-orange-500" /> ID Formats
                      </h3>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-white/[0.04] text-[10px] uppercase tracking-widest font-bold text-slate-500">
                            <th className="px-5 py-2.5">Source</th>
                            <th className="px-5 py-2.5">Format</th>
                            <th className="px-5 py-2.5">Example</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr>
                            <td className="px-5 py-2 font-bold text-slate-300 text-xs">IMDb</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">tt + numbers</td>
                            <td className="px-5 py-2 font-mono text-orange-200/50 text-xs">tt0133093</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-bold text-slate-300 text-xs">TMDB</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">tmdb:id or tmdb:movie:id or tmdb:tv:id or tmdb:series:id</td>
                            <td className="px-5 py-2 font-mono text-orange-200/50 text-xs">tmdb:movie:603, tmdb:tv:1399, tmdb:series:1399</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-bold text-slate-300 text-xs">Kitsu</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">kitsu:id</td>
                            <td className="px-5 py-2 font-mono text-orange-200/50 text-xs">kitsu:1</td>
                          </tr>
                          <tr>
                            <td className="px-5 py-2 font-bold text-slate-300 text-xs">Anime</td>
                            <td className="px-5 py-2 text-slate-400 text-xs">provider:id</td>
                            <td className="px-5 py-2 font-mono text-orange-200/50 text-xs">anilist:123, mal:456</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-6 bg-[#080808] border border-white/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 blur-[80px] pointer-events-none" />

                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Base Structure</h4>
                      <div className="p-4 bg-white/[0.04] border border-white/5 rounded-xl font-mono text-xs overflow-x-auto whitespace-nowrap pb-2">
                        <span className="text-slate-500">{baseUrl || 'http://localhost:3000'}</span>
                        <span className="text-white">/</span>
                        <span className="text-orange-500 font-bold">{'{type}'}</span>
                        <span className="text-white">/</span>
                        <span className="text-orange-500 font-bold">{'{id}'}</span>
                        <span className="text-white">.jpg?</span>
                        <span className="text-orange-400 font-bold">ratings</span>=<span className="text-slate-400 font-bold">{'{ratings}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">lang</span>=<span className="text-slate-400 font-bold">{'{lang}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">ratingStyle</span>=<span className="text-slate-400 font-bold">{'{style}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">imageText</span>=<span className="text-slate-400 font-bold">{'{text}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">posterRatingsLayout</span>=<span className="text-slate-400 font-bold">{'{layout}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">posterRatingsMaxPerSide</span>=<span className="text-slate-400 font-bold">{'{max}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">backdropRatingsLayout</span>=<span className="text-slate-400 font-bold">{'{bLayout}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">posterVerticalBadgeContent</span>=<span className="text-slate-400 font-bold">{'{posterVerticalBadgeContent}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">backdropVerticalBadgeContent</span>=<span className="text-slate-400 font-bold">{'{backdropVerticalBadgeContent}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">thumbnailVerticalBadgeContent</span>=<span className="text-slate-400 font-bold">{'{thumbnailVerticalBadgeContent}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">tmdbKey</span>=<span className="text-slate-400 font-bold">{'{tmdbKey}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">mdblistKey</span>=<span className="text-slate-400 font-bold">{'{mdbKey}'}</span>
                        <span className="text-white">&</span>
                        <span className="text-orange-400 font-bold">simklClientId</span>=<span className="text-slate-400 font-bold">{'{simklClientId}'}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="flex gap-2">
                          <span className="text-orange-500 font-bold shrink-0">lang (optional):</span>
                          <span className="text-slate-400">TMDB language codes are supported (en, es-ES, es-MX, pt-PT, pt-BR, etc.). Default: en.</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-orange-500 font-bold shrink-0">id (required):</span>
                          <span className="text-slate-400">IMDb ID (tt...), TMDB ID (tmdb:...), or Kitsu ID (kitsu:...).</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-orange-500 font-bold shrink-0">tmdbKey (required):</span>
                          <span className="text-slate-400">Your TMDB v3 API Key.</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-orange-500 font-bold shrink-0">mdblistKey (required):</span>
                          <span className="text-slate-400">Your MDBList API Key.</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-orange-500 font-bold shrink-0">simklClientId (optional):</span>
                          <span className="text-slate-400">Required only if you want direct SIMKL ratings.</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-10">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Live Examples</h4>
                      <pre className="text-xs font-mono text-slate-400 leading-6 space-y-1.5">
                        <div className="text-slate-600 font-bold">{'// Movie Poster (IMDb)'}</div>
                        <div className="text-orange-200/70 truncate bg-white/[0.04] p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/poster/tt0133093.jpg?ratings=imdb,tmdb&ratingStyle=plain`}</div>

                        <div className="text-slate-600 font-bold mt-4">{'// Backdrop (TMDB)'}</div>
                        <div className="text-orange-200/70 truncate bg-white/[0.04] p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/backdrop/tmdb:603.jpg?ratings=mdblist&backdropRatingsLayout=right-vertical`}</div>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="hidden border-t border-white/5 py-8 bg-[#080808]">
          <div className="w-full mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Star className="w-4 h-4" />
              <span className="text-sm font-[var(--font-display)] tracking-tight text-white">ERDB Stateless Engine</span>
            </div>
            <p className="text-sm text-slate-500">
              (c) 2026 ERDB Project. Modern imagery for modern addons.
            </p>
          </div>
        </footer>
        {isCatalogModalVisible && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <h4 className="text-lg font-[var(--font-display)] text-white">Configure Catalogs</h4>
                  <p className="mt-1 text-xs text-slate-400">
                    Customize the catalog names exposed by the generated proxy manifest.
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Discover-only is supported by adding a required `discover` extra. Keep in mind that Stremio expects no more than one required extra per catalog.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={resetProxyCatalogCustomizations}
                    disabled={!hasCatalogCustomizations}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${hasCatalogCustomizations ? 'border border-white/10 bg-[#121212] text-slate-200 hover:bg-[#181818]' : 'border border-white/5 bg-[#080808] text-slate-600 cursor-not-allowed'}`}
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCatalogModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-[#121212] px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-[#181818]"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="max-h-[75vh] overflow-auto overscroll-contain px-5 py-4">
                {proxyCatalogsStatus === 'loading' && (
                  <div className="rounded-2xl border border-white/10 bg-[#080808] p-4 text-sm text-slate-400">
                    Loading catalogs from the manifest...
                  </div>
                )}
                {proxyCatalogsStatus === 'error' && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    {proxyCatalogsError || 'Unable to load catalogs from the source manifest.'}
                  </div>
                )}
                {proxyCatalogsStatus === 'ready' && proxyCatalogs.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#080808] p-4 text-sm text-slate-400">
                    This manifest does not include configurable catalogs.
                  </div>
                )}
                {proxyCatalogs.length > 0 && (
                  <div className="space-y-3">
                    {proxyCatalogs.map((catalog) => {
                      const overrideValue = proxyCatalogNames[catalog.key] || '';
                      const isHidden = proxyHiddenCatalogs.includes(catalog.key);
                      const isSearchDisabled = proxySearchDisabledCatalogs.includes(catalog.key);
                      const isDiscoverOnly = proxyDiscoverOnlyCatalogs[catalog.key] ?? catalog.discoverOnly;
                      const blockingRequiredExtraKeys = catalog.requiredExtraKeys.filter(
                        (name) => name !== 'discover'
                      );
                      const canSetDiscoverOnly = blockingRequiredExtraKeys.length === 0;
                      return (
                        <div
                          key={catalog.key}
                          className="rounded-2xl border border-white/10 bg-[#080808]/90 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">{catalog.name}</div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                {[catalog.type || 'catalog', catalog.id].filter(Boolean).join(' / ')}
                              </div>
                              {catalog.extraKeys.length > 0 && (
                                <div className="mt-1 text-[10px] text-slate-600">
                                  Extras: {catalog.extraKeys.join(', ')}
                                </div>
                              )}
                              {catalog.supportsSearch && (
                                <div className="mt-1 text-[10px] text-slate-600">
                                  Search: {catalog.searchRequired ? 'search only' : 'search + catalog'}
                                </div>
                              )}
                            </div>
                            {overrideValue && (
                              <button
                                type="button"
                                onClick={() => updateProxyCatalogName(catalog.key, '')}
                                className="rounded-lg border border-white/10 bg-[#121212] px-2.5 py-1 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-[#181818]"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => toggleProxyCatalogHidden(catalog.key)}
                              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${isHidden ? 'border-orange-500/50 bg-orange-500/10 text-orange-200' : 'border-white/10 bg-[#121212] text-slate-300 hover:bg-[#181818]'}`}
                            >
                              {isHidden ? 'Hidden' : 'Visible'}
                            </button>
                            {catalog.supportsSearch && (
                              <button
                                type="button"
                                onClick={() => toggleProxyCatalogSearchDisabled(catalog.key)}
                                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${isSearchDisabled ? 'border-orange-500/50 bg-orange-500/10 text-orange-200' : 'border-white/10 bg-[#121212] text-slate-300 hover:bg-[#181818]'}`}
                              >
                                {isSearchDisabled ? 'Search Off' : 'Search On'}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!canSetDiscoverOnly}
                              onClick={() => setProxyCatalogDiscoverOnly(catalog.key, !isDiscoverOnly)}
                              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${!canSetDiscoverOnly ? 'border border-white/5 bg-[#080808] text-slate-600 cursor-not-allowed' : isDiscoverOnly ? 'border-orange-500/50 bg-orange-500/10 text-orange-200' : 'border-white/10 bg-[#121212] text-slate-300 hover:bg-[#181818]'}`}
                            >
                              {isDiscoverOnly ? 'Discover Only' : 'Home + Discover'}
                            </button>
                          </div>
                          <div className="mt-3">
                            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              Custom Name
                            </label>
                            <input
                              type="text"
                              value={overrideValue}
                              onChange={(event) => updateProxyCatalogName(catalog.key, event.target.value)}
                              placeholder={catalog.name}
                              className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2.5 py-2 text-xs text-white outline-none focus:border-orange-500/50"
                            />
                            <p className="mt-2 text-[10px] text-slate-500">
                              {overrideValue
                                ? `Proxy manifest name: ${overrideValue}`
                                : 'Leave empty to keep the original catalog name.'}
                            </p>
                            {isHidden && (
                              <p className="mt-1 text-[10px] text-slate-600">
                                {catalog.supportsSearch && !isSearchDisabled
                                  ? 'This catalog will stay searchable, but it will be converted to search-only so it no longer appears in home/discover.'
                                  : 'This catalog will be removed from the generated manifest.'}
                              </p>
                            )}
                            {catalog.supportsSearch && isSearchDisabled && (
                              <p className="mt-1 text-[10px] text-slate-600">
                                {catalog.searchRequired
                                  ? 'This is a search-only catalog, so disabling search removes it from the generated manifest.'
                                  : 'Search support will be removed, but the catalog itself will stay available.'}
                              </p>
                            )}
                            {!canSetDiscoverOnly && (
                              <p className="mt-1 text-[10px] text-slate-600">
                                Discover-only is unavailable while this catalog still has another required extra: {blockingRequiredExtraKeys.join(', ')}.
                              </p>
                            )}
                            {canSetDiscoverOnly && isDiscoverOnly && (
                              <p className="mt-1 text-[10px] text-slate-600">
                                This catalog will stay available in Discover without appearing on the home rows.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {isAiometadataModalVisible && (
          <div className="fixed inset-0 z-[81] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-[var(--font-display)] text-white">
                    <Terminal className="h-5 w-5 text-orange-500" />
                    <span>Aiometadata Patterns</span>
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    Choose whether AiOMetadata episode IDs should use `IMDb` or `TVDB`, then copy the URL patterns you need.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiometadataModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-[#121212] px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-[#181818]"
                >
                  Close
                </button>
              </div>
              <div className="max-h-[80vh] overflow-auto overscroll-contain px-5 py-4">
                <p className="max-w-3xl text-sm text-slate-400">
                  Series and anime should use the same provider here. For anime, AiOMetadata may send a Kitsu ID in the season slot when TVDB mapping fails, so TVDB thumbnails can still be incorrect.
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-[#080808]/90 p-3">
                  <div className="text-[11px] font-semibold text-slate-400">AiOMetadata Series/Anime Provider</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {AIOMETADATA_EPISODE_PROVIDER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setAiometadataEpisodeProvider(option.id)}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${aiometadataEpisodeProvider === option.id ? 'border-orange-500/60 bg-[#121212] text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {([
                    ['poster', 'Poster URL Pattern'],
                    ['background', 'Background URL Pattern'],
                    ['logo', 'Logo URL Pattern'],
                    ['episodeThumbnail', 'Episode Thumbnail URL Pattern'],
                  ] as Array<[AiometadataPatternType, string]>).map(([type, label]) => {
                    const value = aiometadataPatterns[type];
                    const isCopied = aiometadataCopiedType === type;
                    const isAvailable = Boolean(value);
                    return (
                      <div key={type} className="rounded-2xl border border-white/10 bg-[#080808]/90 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-slate-400">{label}</div>
                          <button
                            onClick={() => handleCopyAiometadataPattern(type)}
                            disabled={!isAvailable}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${isAvailable ? (isCopied ? 'bg-green-500 text-white' : 'bg-orange-500 text-black hover:bg-orange-400') : 'cursor-not-allowed bg-[#121212] text-slate-500'}`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>COPIED</span>
                              </>
                            ) : (
                              <>
                                <Clipboard className="h-3.5 w-3.5" />
                                <span>COPY</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="mt-2 min-h-28 rounded-xl border border-white/10 bg-[#0a0a0a]/80 p-3">
                          <div className="whitespace-pre-wrap break-all font-mono text-xs text-slate-300">
                            {value || 'Not available.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>


    {/* Rotate Token Modal */}
    {isRotateModalOpen && (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) handleCloseRotateModal(); }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0d10] shadow-[0_40px_140px_-30px_rgba(0,0,0,1)]">
          {/* Header */}
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-400/20">
                <RefreshCcw className="h-5 w-5 text-orange-300" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Rotate Token</div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Genera un nuovo token e migra automaticamente la configurazione.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            {rotateStatus !== 'success' && (
              <>
                {/* Warning */}
                <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <p className="text-[11px] leading-5 text-amber-200">
                    The old token will be <strong>permanently deleted</strong> and replaced with a new one using the same configuration and password.
                    Update your saved credentials after rotation.
                  </p>
                </div>

                {/* Password input */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Current token password
                  </label>
                  <div className="relative">
                    <input
                      type={rotateShowPassword ? 'text' : 'password'}
                      value={rotatePassword}
                      onChange={(e) => setRotatePassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && rotateStatus !== 'loading') handleRotateToken(); }}
                      placeholder="Your password"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-4 pr-11 text-sm text-white outline-none transition focus:border-orange-400/50"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setRotateShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {rotateShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {rotateMessage && (
                  <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {rotateMessage}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseRotateModal}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRotateToken}
                    disabled={rotateStatus === 'loading' || !rotatePassword}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCcw className={`h-4 w-4 ${rotateStatus === 'loading' ? 'animate-spin' : ''}`} />
                    {rotateStatus === 'loading' ? 'Rotating...' : 'Generate New Token'}
                  </button>
                </div>
              </>
            )}

            {rotateStatus === 'success' && (
              <>
                {/* Success state */}
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p className="text-[11px] leading-5 text-emerald-200">
                    Token rotated successfully. Your configuration has been automatically migrated.
                    Your browser will be prompted to update saved credentials.
                  </p>
                </div>

                {/* New token display */}
                <div>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    New Token
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#080808] px-4 py-3">
                    <span className="flex-1 break-all font-mono text-xs text-white">{rotatedNewToken}</span>
                    <button
                      onClick={handleCopyRotatedToken}
                      className="shrink-0 rounded-lg bg-white/[0.06] p-2 transition hover:bg-white/[0.12]"
                    >
                      {rotateCopied ? <Check className="h-4 w-4 text-emerald-300" /> : <Clipboard className="h-4 w-4 text-slate-300" />}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Save this token. Use it with the same password on your next login.
                  </p>
                </div>

                <button
                  onClick={handleCloseRotateModal}
                  className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                >
                  Close and reload
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
