'use client';

import {
  Eye, EyeOff, Check, Clipboard, ClipboardPaste, Download, ExternalLink, Layers, ListChecks, Share2, Terminal, Upload,
} from 'lucide-react';
import type { HomePageViewProps } from '@/components/workspace/types';
import { Card, Notice, PanelHeader } from './ui';
import {
  BTN_ACCENT_CLASS,
  BTN_BASE_CLASS,
  BTN_GHOST_CLASS,
  BTN_INACTIVE_CLASS,
  CHIP_ACTIVE_CLASS,
  CHIP_INACTIVE_CLASS,
  INPUT_CLASS,
  PANEL_CLASS,
  PANEL_HEADER_CLASS,
  PROXY_EPISODE_PROVIDER_OPTIONS,
  PROXY_SERIES_METADATA_PROVIDER_OPTIONS,
  PROXY_TYPES,
  isCinemetaManifestUrl,
} from './constants';

type WorkspaceProxyPanelProps = Pick<HomePageViewProps, 'state' | 'derived' | 'actions'> & {
  onOpenCatalogModal: () => void;
  onOpenPatternsModal: () => void;
};

function Step({
  index,
  title,
  description,
  done,
  children,
}: {
  index: number;
  title: string;
  description: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
            done ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-slate-400'
          }`}
        >
          {done ? <Check className="h-3 w-3" /> : index}
        </span>
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-slate-200">{title}</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
      <div className="pl-9">{children}</div>
    </section>
  );
}

export function WorkspaceProxyPanel({ state, derived, actions, onOpenCatalogModal, onOpenPatternsModal }: WorkspaceProxyPanelProps) {
  const {
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
    proxyCopied,
    exportStatus,
    importStatus,
    importMessage,
  } = state;

  const { stremioInstallUrl, canGenerateProxy, isProxyUrlVisible, displayedProxyUrl } = derived;

  const {
    updateProxyManifestUrl,
    toggleProxyEnabledType,
    toggleProxyTranslateMeta,
    setProxySeriesMetadataProvider,
    setProxyAiometadataProvider,
    toggleProxyUrlVisibility,
    handleCopyProxy,
    handleExportConfig,
    handleImportFile,
    handleImportConfigString,
  } = actions;

  const normalizedProxyManifestUrl = proxyManifestUrl.trim().toLowerCase();
  const isAiometadataProxyManifest = normalizedProxyManifestUrl.includes('aiometadata');
  const isCinemetaProxyManifest = isCinemetaManifestUrl(proxyManifestUrl.trim());
  const canConfigureCatalogs =
    Boolean(normalizedProxyManifestUrl) &&
    normalizedProxyManifestUrl !== 'http://' &&
    normalizedProxyManifestUrl !== 'https://';

  const customizedCatalogCount = Object.keys(proxyCatalogNames).length;
  const hiddenCatalogCount = proxyHiddenCatalogs.length;
  const searchDisabledCatalogCount = proxySearchDisabledCatalogs.length;
  const discoverOnlyCatalogCount = proxyCatalogs.filter(
    (catalog) => (proxyDiscoverOnlyCatalogs[catalog.key] ?? catalog.discoverOnly) === true
  ).length;

  const totalCatalogFlags =
    customizedCatalogCount + hiddenCatalogCount + searchDisabledCatalogCount + discoverOnlyCatalogCount;
  const enabledTypeCount = PROXY_TYPES.filter((type) => proxyEnabledTypes[type]).length;

  return (
    <div id="proxy" className={`${PANEL_CLASS} xl:order-3`}>
      <div className={PANEL_HEADER_CLASS}>
        <PanelHeader
          icon={<Layers className="h-4 w-4" />}
          title="Addon proxy"
          subtitle="Add ERDB ratings and quality badges to any Stremio addon."
          accent="sky"
        />
      </div>

      <div className="premium-scrollbar flex-1 space-y-5 overflow-y-auto p-4">
        <Notice tone="info">
          Paste any Stremio addon manifest to generate a proxy manifest. ERDB adds rating badges, quality indicators and
          JustWatch rankings without modifying the original addon.
        </Notice>

        <Step
          index={1}
          title="Source manifest"
          description="The manifest URL of the addon you want to enhance."
          done={canConfigureCatalogs}
        >
          <Card>
            <input
              type="url"
              value={proxyManifestUrl}
              onChange={(event) => updateProxyManifestUrl(event.target.value)}
              placeholder="https://addon.example.com/manifest.json"
              aria-label="Addon manifest URL"
              className={INPUT_CLASS}
            />

            {canConfigureCatalogs && (
              <div className="mt-3 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenCatalogModal}
                    className={`${BTN_BASE_CLASS} ${BTN_GHOST_CLASS} cursor-pointer px-3 py-2`}
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    <span>Configure catalogs</span>
                  </button>
                  {totalCatalogFlags > 0 && (
                    <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold text-orange-200">
                      {totalCatalogFlags} customization{totalCatalogFlags === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                {proxyCatalogsStatus === 'loading' && (
                  <p className="text-[11px] text-slate-500">Loading catalogs from the manifest…</p>
                )}
                {proxyCatalogsStatus === 'ready' && proxyCatalogs.length > 0 && totalCatalogFlags === 0 && (
                  <p className="text-[11px] text-emerald-400/80">
                    {proxyCatalogs.length} catalog{proxyCatalogs.length === 1 ? '' : 's'} available.
                  </p>
                )}
                {proxyCatalogsStatus === 'error' && <Notice tone="danger">{proxyCatalogsError}</Notice>}
              </div>
            )}
          </Card>
        </Step>

        <Step
          index={2}
          title="ID alignment"
          description="How ERDB maps the addon IDs to the metadata providers."
          done={!canConfigureCatalogs || isAiometadataProxyManifest || isCinemetaProxyManifest}
        >
          {!canConfigureCatalogs ? (
            <p className="text-[11px] text-slate-500">Add a manifest URL to unlock ID settings.</p>
          ) : isAiometadataProxyManifest ? (
            <Card>
              <p className="text-[11px] leading-relaxed text-slate-400">
                AiOMetadata IDs require alignment. Pick <strong className="font-semibold text-slate-200">IMDb</strong> if
                the addon outputs real IMDb IDs, or <strong className="font-semibold text-slate-200">TVDB</strong> if it
                bridges IMDb logic with TVDB numbering.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PROXY_EPISODE_PROVIDER_OPTIONS.map((option) => (
                  <button
                    key={`proxy-provider-${option.id}`}
                    type="button"
                    onClick={() => setProxyAiometadataProvider(option.id)}
                    className={`${BTN_BASE_CLASS} cursor-pointer px-3 py-2 ${proxyAiometadataProvider === option.id ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Card>
          ) : isCinemetaProxyManifest ? (
            <p className="text-[11px] text-slate-500">Cinemeta manifests use standard IMDb IDs and need no extra settings.</p>
          ) : (
            <Card>
              <div className="flex flex-wrap gap-2">
                {PROXY_SERIES_METADATA_PROVIDER_OPTIONS.map((option) => (
                  <button
                    key={`proxy-series-provider-${option.id}`}
                    type="button"
                    onClick={() => setProxySeriesMetadataProvider(option.id)}
                    className={`${BTN_BASE_CLASS} cursor-pointer px-3 py-2 ${proxySeriesMetadataProvider === option.id ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                Metadata provider used to resolve series and episode entries.
              </p>
            </Card>
          )}
        </Step>

        <Step
          index={3}
          title="What to replace"
          description="Choose the artwork types the proxy should override, then copy the generated manifest."
          done={enabledTypeCount > 0}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PROXY_TYPES.map((type) => (
                <button
                  key={`proxy-enabled-${type}`}
                  type="button"
                  onClick={() => toggleProxyEnabledType(type)}
                  aria-pressed={proxyEnabledTypes[type]}
                  className={`${BTN_BASE_CLASS} cursor-pointer px-3 py-2 ${
                    proxyEnabledTypes[type] ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleProxyTranslateMeta}
              aria-pressed={proxyTranslateMeta}
              className={`${BTN_BASE_CLASS} cursor-pointer px-3 py-2 ${proxyTranslateMeta ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS}`}
            >
              Translate addon metadata
            </button>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Injects the selected language into plots, titles and episodes directly into the stream metadata.
            </p>
          </div>
        </Step>

        <Step
          index={4}
          title="Output"
          description="Copy the proxy manifest into Stremio, or install it directly."
          done={canGenerateProxy}
        >
          <Card className="border-sky-400/15 bg-sky-500/[0.04]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-300/80">Manifest URL</span>
              <button
                type="button"
                onClick={toggleProxyUrlVisibility}
                className={`${BTN_BASE_CLASS} ${BTN_GHOST_CLASS} cursor-pointer px-2.5 py-1.5 text-[10px]`}
              >
                {isProxyUrlVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>{isProxyUrlVisible ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-white/5 bg-black/40 p-3">
              <div
                className={`w-full max-w-full break-all font-mono text-[11px] leading-relaxed text-slate-300 ${
                  !isProxyUrlVisible ? 'select-none blur-sm opacity-50' : ''
                }`}
              >
                {displayedProxyUrl}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleCopyProxy}
                disabled={!canGenerateProxy}
                className={`${BTN_BASE_CLASS} flex-1 px-4 py-2.5 ${
                  canGenerateProxy
                    ? proxyCopied
                      ? 'bg-emerald-500 text-black'
                      : BTN_ACCENT_CLASS
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                {proxyCopied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                <span>{proxyCopied ? 'Copied!' : 'Copy manifest URL'}</span>
              </button>
              <a
                href={canGenerateProxy ? stremioInstallUrl : undefined}
                target="_blank"
                rel="noreferrer"
                className={`${BTN_BASE_CLASS} flex-1 px-4 py-2.5 ${
                  canGenerateProxy ? BTN_GHOST_CLASS : 'pointer-events-none border border-white/5 text-slate-600'
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Install in Stremio</span>
              </a>
            </div>
          </Card>
        </Step>

        <div className="flex items-center gap-2 border-t border-white/5 pt-4 text-[10px] text-slate-600">
          <Share2 className="h-3 w-3" />
          <span>
            {enabledTypeCount} artwork type{enabledTypeCount === 1 ? '' : 's'} replaced ·{' '}
            {totalCatalogFlags} catalog customization{totalCatalogFlags === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="shrink-0 space-y-3 border-t border-white/5 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Terminal className="h-4 w-4 shrink-0 text-teal-400" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200">URL patterns</div>
              <p className="truncate text-[10px] text-slate-500">Renderer URLs and AiOMetadata patterns.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPatternsModal}
            className={`${BTN_BASE_CLASS} ${BTN_GHOST_CLASS} shrink-0 cursor-pointer px-3 py-2`}
          >
            Open
          </button>
        </div>

        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <Download className="h-3.5 w-3.5 shrink-0 text-orange-400" />
            <span className="text-xs font-semibold text-slate-200">Import &amp; export</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleExportConfig(false)}
              className={`${BTN_BASE_CLASS} ${BTN_GHOST_CLASS} w-full cursor-pointer px-2 py-2 text-[11px]`}
              title="Export the current configuration without API keys"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportConfig(true)}
              className={`${BTN_BASE_CLASS} ${BTN_INACTIVE_CLASS} w-full cursor-pointer px-2 py-2 text-[11px]`}
              title="Export the current configuration including API keys"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export + keys</span>
            </button>
            <label
              className={`${BTN_BASE_CLASS} ${BTN_GHOST_CLASS} w-full cursor-pointer px-2 py-2 text-[11px]`}
              title="Import a JSON file, an old config string or a proxy URL"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import file</span>
              <input type="file" accept=".json,.txt,application/json,text/plain" onChange={handleImportFile} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => {
                const pastedValue = window.prompt('Paste an old ERDB configuration or a proxy URL');
                if (pastedValue?.trim()) handleImportConfigString(pastedValue);
              }}
              className={`${BTN_BASE_CLASS} ${BTN_INACTIVE_CLASS} w-full cursor-pointer px-2 py-2 text-[11px]`}
              title="Paste a configuration string or proxy URL"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              <span>Paste config</span>
            </button>
          </div>
          {exportStatus !== 'idle' && (
            <p className="mt-2 text-[10px] text-emerald-300/90">
              Configuration exported {exportStatus === 'with' ? 'with' : 'without'} API keys.
            </p>
          )}
          {importStatus === 'error' && (
            <p className="mt-2 text-[10px] text-rose-300">{importMessage || 'Invalid configuration.'}</p>
          )}
          {importStatus === 'success' && (
            <p className="mt-2 text-[10px] text-emerald-300/90">{importMessage || 'Configuration imported.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
