'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Terminal, Check, Clipboard, RefreshCcw, ShieldAlert, Eye, EyeOff, GripVertical, Clapperboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { HomePageViewProps } from '@/components/workspace/types';
import { AIOMETADATA_EPISODE_PROVIDER_OPTIONS } from './constants';
import type { AiometadataPatternType } from '@/components/workspace/types';

const MOVIE_ID_PATTERNS = [
  ['IMDb movie', '{imdb_id}'],
  ['TMDB movie', 'tmdb:{tmdb_id}'],
  ['Kitsu anime', 'kitsu:{kitsu_id}'],
  ['AniList anime', 'anilist:{anilist_id}'],
  ['AniDB anime', 'anidb:{anidb_id}'],
  ['MyAnimeList anime', 'mal:{mal_id}'],
] as const;

const SERIES_ID_PATTERNS = [
  ['IMDb series', '{imdb_id}'],
  ['TMDB series', 'tmdb:{tmdb_id}'],
  ['TVDB bridge', 'tvdb:{tvdb_id}'],
  ['IMDb TV bridge', 'realimdb:{imdb_id}'],
  ['Kitsu anime', 'kitsu:{kitsu_id}'],
  ['AniList anime', 'anilist:{anilist_id}'],
  ['AniDB anime', 'anidb:{anidb_id}'],
  ['MyAnimeList anime', 'mal:{mal_id}'],
] as const;

const EPISODE_ID_PATTERNS = [
  ['IMDb episode', '{series_imdb_id}:{season}:{episode}'],
  ['TMDB episode', 'tmdb:{tmdb_id}:{season}:{episode}'],
  ['TVDB episode', 'tvdb:{tvdb_id}:{season}:{episode}'],
  ['IMDb TV episode', 'realimdb:{series_imdb_id}:{season}:{episode}'],
  ['Kitsu episode', 'kitsu:{kitsu_id}:{season}:{episode}'],
  ['AniList episode', 'anilist:{anilist_id}:{season}:{episode}'],
  ['AniDB episode', 'anidb:{anidb_id}:{season}:{episode}'],
  ['MyAnimeList episode', 'mal:{mal_id}:{season}:{episode}'],
] as const;

const NUVIO_PATTERN_ENTRIES = [
  ['poster', 'Poster URL Pattern', 'poster/{id}.jpg?type={type}&shape={shape}'],
  ['backdrop', 'Backdrop URL Pattern', 'backdrop/{id}.jpg?type={type}'],
  ['logo', 'Logo URL Pattern', 'logo/{id}.jpg?type={type}'],
  ['thumbnail', 'Episode Thumbnail URL Pattern', 'thumbnail/{id}:{season}:{episode}.jpg?type={type}'],
] as const;

type RendererUrlPattern = readonly [label: string, id: string];
type RendererUrlKindGroup = { kind: 'movie' | 'series'; patterns: readonly RendererUrlPattern[] };

const URL_PATTERN_GROUPS: Array<{ type: string; label: string; kinds: RendererUrlKindGroup[] }> = [
  {
    type: 'poster',
    label: 'Poster',
    kinds: [
      { kind: 'movie', patterns: MOVIE_ID_PATTERNS },
      { kind: 'series', patterns: SERIES_ID_PATTERNS },
    ],
  },
  {
    type: 'backdrop',
    label: 'Backdrop',
    kinds: [
      { kind: 'movie', patterns: MOVIE_ID_PATTERNS },
      { kind: 'series', patterns: SERIES_ID_PATTERNS },
    ],
  },
  {
    type: 'logo',
    label: 'Logo',
    kinds: [
      { kind: 'movie', patterns: MOVIE_ID_PATTERNS },
      { kind: 'series', patterns: SERIES_ID_PATTERNS },
    ],
  },
  {
    type: 'thumbnail',
    label: 'Episode thumbnail',
    kinds: [{ kind: 'series', patterns: EPISODE_ID_PATTERNS }],
  },
];

function SortableCatalogCard({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    transition: { duration: 220, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2.5 ${isDragging ? 'relative z-10 opacity-30' : ''}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${label}`}
        title="Drag to reorder"
        className="mt-4 shrink-0 cursor-grab touch-none rounded-lg border border-white/10 bg-[#121212] p-1.5 text-slate-500 transition-colors hover:border-orange-400/40 hover:text-orange-300 active:cursor-grabbing [-webkit-tap-highlight-color:transparent]"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function CatalogDragPreview({ name, type }: { name: string; type: string }) {
  return (
    <div className="pointer-events-none flex max-w-[min(100vw-2rem,320px)] items-center gap-2 rounded-2xl border border-orange-400/40 bg-[#141b26]/95 px-3 py-2.5 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.65)] ring-2 ring-orange-500/35">
      <GripVertical className="h-4 w-4 shrink-0 text-orange-400/80" />
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-white">{name}</div>
        {type && <div className="truncate text-[10px] text-slate-400">{type}</div>}
      </div>
    </div>
  );
}

type WorkspaceModalsProps = Pick<HomePageViewProps, 'state' | 'actions' | 'derived'> & {
  isCatalogModalOpen: boolean;
  setIsCatalogModalOpen: (v: boolean) => void;
  isAiometadataModalOpen: boolean;
  setIsAiometadataModalOpen: (v: boolean) => void;
  isRotateModalOpen: boolean;
  setIsRotateModalOpen: (v: boolean) => void;
};

export function WorkspaceModals({ state, actions, derived, isCatalogModalOpen, setIsCatalogModalOpen, isAiometadataModalOpen, setIsAiometadataModalOpen, isRotateModalOpen, setIsRotateModalOpen }: WorkspaceModalsProps) {
  const {
    proxyCatalogsStatus,
    proxyCatalogsError,
    proxyCatalogs,
    proxyCatalogNames,
    proxyCatalogOrder,
    proxyHiddenCatalogs,
    proxySearchDisabledCatalogs,
    proxyDiscoverOnlyCatalogs,
    aiometadataEpisodeProvider,
    activeToken,
  } = state;

  const { aiometadataPatterns, baseUrl } = derived;
  const hasCatalogCustomizations = Object.keys(proxyCatalogNames).length > 0 || proxyCatalogOrder.length > 0 || proxyHiddenCatalogs.length > 0 || proxySearchDisabledCatalogs.length > 0 || Object.keys(proxyDiscoverOnlyCatalogs).length > 0;

  const {
    resetProxyCatalogCustomizations,
    updateProxyCatalogName,
    setProxyCatalogOrder,
    toggleProxyCatalogHidden,
    toggleProxyCatalogSearchDisabled,
    setProxyCatalogDiscoverOnly,
    setAiometadataEpisodeProvider,
  } = actions;

  const orderedCatalogs = useMemo(() => {
    const position = new Map(proxyCatalogOrder.map((key, index) => [key, index]));
    return [...proxyCatalogs].sort(
      (a, b) => (position.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (position.get(b.key) ?? Number.MAX_SAFE_INTEGER)
    );
  }, [proxyCatalogs, proxyCatalogOrder]);
  const catalogIds = useMemo(() => orderedCatalogs.map((catalog) => catalog.key), [orderedCatalogs]);
  const [draggedCatalogId, setDraggedCatalogId] = useState<string | null>(null);
  const draggedCatalog = draggedCatalogId
    ? orderedCatalogs.find((catalog) => catalog.key === draggedCatalogId) ?? null
    : null;
  const overlayRoot = typeof document === 'undefined' ? null : document.body;

  const catalogSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCatalogDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedCatalogId(null);
    if (!over || active.id === over.id) return;
    const fromIndex = catalogIds.indexOf(String(active.id));
    const toIndex = catalogIds.indexOf(String(over.id));
    if (fromIndex < 0 || toIndex < 0) return;
    const nextOrder = [...catalogIds];
    const [movedId] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, movedId);
    setProxyCatalogOrder(nextOrder);
  };

  const [copiedPatternKey, setCopiedPatternKey] = useState<string | null>(null);

  const handleCopyPattern = async (key: string, pattern: string) => {
    if (!pattern) return;
    await navigator.clipboard.writeText(pattern);
    setCopiedPatternKey(key);
    setTimeout(() => setCopiedPatternKey((current) => (current === key ? null : current)), 2000);
  };

  const handleCopyAiometadataPattern = async (type: AiometadataPatternType) => {
    const pattern = aiometadataPatterns[type];
    await handleCopyPattern(`aiometadata-${type}`, pattern);
  };

  const rendererBaseUrl = (baseUrl || 'https://easyratingsdb.com').replace(/\/+$/, '');
  const rendererToken = activeToken || '{token}';
  const buildRendererUrl = (type: string, kind: string, id: string) => `${rendererBaseUrl}/${rendererToken}/${type}/${kind}/${id}.jpg`;

  // Local state for Rotation Modal
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
        } catch (e) {
          console.warn('Unable to store password credential:', e);
        }
      }
      window.location.reload();
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsCatalogModalOpen(false)}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] flex flex-col max-h-full"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4 shrink-0">
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
                {proxyCatalogOrder.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setProxyCatalogOrder([])}
                    className="rounded-lg border border-white/10 bg-[#121212] px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-[#181818]"
                  >
                    Reset order
                  </button>
                )}
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
            <div className="overflow-y-auto overscroll-contain px-5 py-4 premium-scrollbar">
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
                  <p className="text-[11px] text-slate-500">
                    Drag the grip on the left to change the order of the catalogs in the generated manifest.
                  </p>
                  <DndContext
                    sensors={catalogSensors}
                    collisionDetection={closestCorners}
                    onDragStart={(event) => setDraggedCatalogId(String(event.active.id))}
                    onDragEnd={handleCatalogDragEnd}
                    onDragCancel={() => setDraggedCatalogId(null)}
                  >
                    <SortableContext items={catalogIds} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {orderedCatalogs.map((catalog) => {
                          const overrideValue = proxyCatalogNames[catalog.key] || '';
                          const isHidden = proxyHiddenCatalogs.includes(catalog.key);
                          const isSearchDisabled = proxySearchDisabledCatalogs.includes(catalog.key);
                          const isDiscoverOnly = proxyDiscoverOnlyCatalogs[catalog.key] ?? catalog.discoverOnly;
                          const blockingRequiredExtraKeys = catalog.requiredExtraKeys.filter(
                            (name) => name !== 'discover'
                          );
                          const canSetDiscoverOnly = blockingRequiredExtraKeys.length === 0;
                          return (
                            <SortableCatalogCard key={catalog.key} id={catalog.key} label={catalog.name}>
                              <div className="rounded-2xl border border-white/10 bg-[#080808]/90 p-4">
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
                            </SortableCatalogCard>
                          );
                        })}
                      </div>
                    </SortableContext>
                    {overlayRoot
                      ? createPortal(
                          <DragOverlay zIndex={9999}>
                            {draggedCatalog ? (
                              <CatalogDragPreview name={draggedCatalog.name} type={draggedCatalog.type} />
                            ) : null}
                          </DragOverlay>,
                          overlayRoot
                        )
                      : null}
                  </DndContext>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {isAiometadataModalOpen && (
        <div className="fixed inset-0 z-[81] flex items-center justify-center px-4 py-6">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsAiometadataModalOpen(false)}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0a] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] flex flex-col max-h-full"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4 shrink-0">
              <div>
                <h4 className="flex items-center gap-2 text-lg font-[var(--font-display)] text-white">
                  <Terminal className="h-5 w-5 text-orange-500" />
                  <span>URL Patterns</span>
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Copy every supported renderer URL combination, including the AiOMetadata-specific patterns.
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
            <div className="overflow-y-auto overscroll-contain px-5 py-4 premium-scrollbar">
              <section aria-labelledby="nuvio-patterns-heading">
                <div>
                  <h5 id="nuvio-patterns-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Clapperboard className="h-4 w-4 text-violet-400" />
                    Nuvio Patterns
                  </h5>
                  <p className="mt-1 max-w-3xl text-xs text-slate-500">
                    Ready-to-paste patterns for Nuvio custom artwork fields.{' '}
                    {'{id}'} is the full meta ID (tt..., tmdb:1396, kitsu:7442, ...), {'{type}'} resolves to movie/series, and{' '}
                    {'{season}'}/{'{episode}'} are used by episode thumbnails. On the poster pattern,{' '}
                    {'{shape}'} (poster|landscape) forces the backdrop-as-poster layout per request; {'{shape}'}=square is not supported.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {NUVIO_PATTERN_ENTRIES.map(([key, label, suffix]) => {
                    const patternKey = `nuvio-${key}`;
                    const value = `${rendererBaseUrl}/${rendererToken}/${suffix}`;
                    const isCopied = copiedPatternKey === patternKey;
                    return (
                      <div key={key} className="rounded-2xl border border-white/10 bg-[#080808]/90 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-slate-400">{label}</div>
                          <button
                            type="button"
                            onClick={() => handleCopyPattern(patternKey, value)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${isCopied ? 'cursor-pointer bg-green-500 text-white' : 'cursor-pointer bg-orange-500 text-black hover:bg-orange-400'}`}
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
                        <div className="mt-2 rounded-xl border border-white/10 bg-[#0a0a0a]/80 p-3">
                          <div className="whitespace-pre-wrap break-all font-mono text-xs text-slate-300">{value}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section aria-labelledby="url-patterns-heading" className="mt-6 border-t border-white/10 pt-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h5 id="url-patterns-heading" className="text-sm font-semibold text-white">Renderer URL combinations</h5>
                    <p className="mt-1 max-w-3xl text-xs text-slate-500">
                      Every image type paired with supported IMDb, TMDB, TVDB, bridge, and anime ID formats, split by movie/series.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-[#121212] px-2.5 py-1 text-[10px] font-mono text-slate-500">
                    {rendererBaseUrl}/{rendererToken}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {URL_PATTERN_GROUPS.map((group) => (
                    <div key={group.type} className="rounded-2xl border border-white/10 bg-[#080808]/90 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-semibold text-slate-300">{group.label}</div>
                        <span className="text-[10px] text-slate-600">
                          {group.kinds.reduce((total, entry) => total + entry.patterns.length, 0)} formats
                        </span>
                      </div>
                      {group.kinds.map(({ kind, patterns }) => (
                        <div key={kind} className="mt-3 first:mt-2">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                            {kind}
                          </div>
                          <div className="mt-2 space-y-2">
                            {patterns.map(([label, id]) => {
                              const key = `url-${group.type}-${kind}-${id}`;
                              const value = buildRendererUrl(group.type, kind, id);
                              const isCopied = copiedPatternKey === key;
                              return (
                                <div key={id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#0a0a0a] p-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[10px] text-slate-600">{label}</div>
                                    <code className="mt-0.5 block break-all font-mono text-[11px] leading-5 text-slate-300">{value}</code>
                                  </div>
                                  <button
                                    type="button"
                                    aria-label={`Copy ${group.label} ${kind} ${label} URL`}
                                    title={`Copy ${group.label} ${kind} ${label} URL`}
                                    onClick={() => handleCopyPattern(key, value)}
                                    className={`shrink-0 rounded-lg p-2 transition-colors ${isCopied ? 'cursor-pointer bg-green-500 text-white' : 'cursor-pointer bg-orange-500 text-black hover:bg-orange-400'}`}
                                  >
                                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>

              <section aria-labelledby="aiometadata-patterns-heading" className="mt-6 border-t border-white/10 pt-5">
                <div>
                  <h5 id="aiometadata-patterns-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Terminal className="h-4 w-4 text-teal-400" />
                    AiOMetadata Patterns
                  </h5>
                  <p className="mt-1 max-w-3xl text-xs text-slate-500">
                    Exact token/config patterns for AiOMetadata. Series and anime should use the same episode provider.
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-[#080808]/90 p-3">
                  <div className="text-[11px] font-semibold text-slate-400">AiOMetadata Series/Anime Provider</div>
                  <p className="mt-1 text-[10px] text-slate-600">
                    TVDB can be incorrect when AiOMetadata sends a Kitsu ID in the season slot.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {AIOMETADATA_EPISODE_PROVIDER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAiometadataEpisodeProvider(option.id)}
                        className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${aiometadataEpisodeProvider === option.id ? 'border-orange-500/60 bg-[#121212] text-white' : 'border-white/10 bg-[#0a0a0a] text-slate-400 hover:text-white'}`}
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
                    const isCopied = copiedPatternKey === `aiometadata-${type}`;
                    const isAvailable = Boolean(value);
                    return (
                      <div key={type} className="rounded-2xl border border-white/10 bg-[#080808]/90 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-slate-400">{label}</div>
                          <button
                            type="button"
                            onClick={() => handleCopyAiometadataPattern(type)}
                            disabled={!isAvailable}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${isAvailable ? (isCopied ? 'cursor-pointer bg-green-500 text-white' : 'cursor-pointer bg-orange-500 text-black hover:bg-orange-400') : 'cursor-not-allowed bg-[#121212] text-slate-500'}`}
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
                        <div className="mt-2 min-h-[7rem] rounded-xl border border-white/10 bg-[#0a0a0a]/80 p-3">
                          <div className="whitespace-pre-wrap break-all font-mono text-xs text-slate-300">
                            {value || 'Not available.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}

      {isRotateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseRotateModal}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0d10] shadow-[0_40px_140px_-30px_rgba(0,0,0,1)]"
          >
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-400/20">
                  <RefreshCcw className="h-5 w-5 text-orange-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Rotate Token</div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Generate a new token and migrate the current configuration automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {rotateStatus !== 'success' && (
                <AnimatePresence mode="popLayout">
                  <motion.div key="rotate-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                      <p className="text-[11px] leading-5 text-amber-200">
                        The old token will be <strong>permanently deleted</strong> and replaced with a new one using the same configuration and password.
                        Update your saved credentials after rotation.
                      </p>
                    </div>

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
                  </motion.div>
                </AnimatePresence>
              )}

              {rotateStatus === 'success' && (
                <AnimatePresence mode="popLayout">
                  <motion.div key="rotate-success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <p className="text-[11px] leading-5 text-emerald-200">
                        Token rotated successfully. Your configuration has been automatically migrated.
                        Your browser will be prompted to update saved credentials.
                      </p>
                    </div>

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
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
