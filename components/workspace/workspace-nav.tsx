'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Save, Check, Clipboard, RefreshCcw, LogOut, Lock, Globe2, MoreHorizontal,
  Search, Tv, Film, X, Loader2, Image as ImageIcon, MonitorPlay, Layers,
} from 'lucide-react';
import type { HomePageViewProps } from '@/components/workspace/types';
import { BTN_ACCENT_CLASS, BTN_BASE_CLASS, BTN_GHOST_CLASS, INPUT_COMPACT_CLASS } from './constants';

const PREVIEW_TYPES = [
  { id: 'poster', label: 'Poster', icon: ImageIcon },
  { id: 'backdrop', label: 'Backdrop', icon: MonitorPlay },
  { id: 'logo', label: 'Logo', icon: Layers },
  { id: 'thumbnail', label: 'Thumbnail', icon: MonitorPlay },
] as const;

type SearchResult = {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  year: string;
  type: 'movie' | 'tv';
  poster: string | null;
};

type WorkspaceNavProps = Pick<HomePageViewProps, 'refs' | 'state' | 'actions' | 'derived'> & {
  onOpenRotateModal: () => void;
};

function MediaIdSearch({
  mediaId,
  setMediaId,
  tmdbKey,
  previewType,
}: {
  mediaId: string;
  setMediaId: (value: string) => void;
  tmdbKey: string;
  previewType: string;
}) {
  const [inputValue, setInputValue] = useState(mediaId);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSearchMode) {
      setInputValue(mediaId);
    }
  }, [mediaId, isSearchMode]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsSearchMode(false);
        setInputValue(mediaId);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mediaId]);

  const runSearch = useCallback(async (query: string, key: string) => {
    if (!query || !key) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/search-title?q=${encodeURIComponent(query)}&tmdbKey=${encodeURIComponent(key)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Search failed');
      const data: { results: SearchResult[] } = await res.json();
      setResults(data.results ?? []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const looksLikeId = /^tt\d*$|^\d*$/.test(val.trim()) || /^\S+:\d*:?\d*$/.test(val.trim());

    if (!looksLikeId && val.trim().length >= 2 && tmdbKey) {
      setIsSearchMode(true);
      setSearchQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runSearch(val.trim(), tmdbKey), 400);
    } else {
      setIsSearchMode(false);
      setIsOpen(false);
      setMediaId(val);
    }
  };

  const handleSearchIconClick = () => {
    if (!tmdbKey) return;
    const val = inputValue.trim();
    if (val && !(/^tt\d+$/.test(val))) {
      setIsSearchMode(true);
      setIsOpen(false);
      setResults([]);
      runSearch(val || searchQuery, tmdbKey);
    }
  };

  const handleSelect = (result: SearchResult) => {
    const baseId = result.imdbId || `tmdb:${result.type}:${result.tmdbId}`;
    const isThumbnailTv = previewType === 'thumbnail' && result.type === 'tv';
    const finalId = isThumbnailTv ? `${baseId}:1:1` : baseId;
    setMediaId(finalId);
    setInputValue(finalId);
    setIsSearchMode(false);
    setIsOpen(false);
    setResults([]);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputValue('');
    setIsSearchMode(false);
    setIsOpen(false);
    setResults([]);
    setMediaId('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsSearchMode(false);
      setInputValue(mediaId);
    }
    if (e.key === 'Enter' && isSearchMode && tmdbKey) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      runSearch(inputValue.trim(), tmdbKey);
    }
  };

  const placeholder = previewType === 'thumbnail' ? 'tt0944947:1:1' : 'tt0133093';

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tmdbKey ? `${placeholder} or title…` : placeholder}
          aria-label="Media ID or title"
          className={`h-9 w-full pl-8 pr-14 sm:w-52 ${INPUT_COMPACT_CLASS}`}
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-7 flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:text-slate-300"
            tabIndex={-1}
            title="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={handleSearchIconClick}
          disabled={!tmdbKey}
          className={`absolute right-1.5 flex h-5 w-5 items-center justify-center rounded-md transition ${tmdbKey ? 'cursor-pointer text-slate-400 hover:text-orange-300' : 'cursor-not-allowed text-slate-600'}`}
          tabIndex={-1}
          title={tmdbKey ? 'Search by title' : 'Add a TMDB key to enable title search'}
        >
          {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 top-full z-[200] mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f14] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <div className="px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Select a result
          </div>
          <div className="max-h-72 overflow-y-auto premium-scrollbar">
            {results.map((r) => (
              <button
                key={r.tmdbId}
                onClick={() => handleSelect(r)}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                  {r.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.poster} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-600">
                      {r.type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-white">{r.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {r.year && <span className="text-[10px] text-slate-500">{r.year}</span>}
                    <span
                      className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        r.type === 'movie' ? 'bg-orange-500/15 text-orange-300' : 'bg-sky-500/15 text-sky-300'
                      }`}
                    >
                      {r.type === 'movie' ? 'Movie' : 'TV'}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {r.imdbId ? (
                    <span className="rounded-lg border border-teal-400/20 bg-teal-500/10 px-2 py-0.5 font-mono text-[9px] text-teal-300">
                      {r.imdbId}
                    </span>
                  ) : (
                    <span className="rounded-lg border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 font-mono text-[9px] text-orange-300">
                      tmdb:{r.tmdbId}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguagePicker({
  lang,
  options,
  onChange,
  className,
}: {
  lang: string;
  options: readonly { id: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <select
      value={lang}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Default language"
      className={`h-9 shrink-0 rounded-xl border border-white/10 bg-[#0d0f14] px-2.5 text-xs font-medium text-white outline-none transition-colors hover:border-orange-400/40 focus:border-orange-400/50 ${className ?? ''}`}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id} className="bg-[#0d0f14] text-white">
          {option.label}
        </option>
      ))}
    </select>
  );
}

function AccountMenu({
  status,
  saveDisabled,
  onSave,
  onRotate,
  onCopyToken,
  onLogout,
}: {
  status: HomePageViewProps['state']['configSaveStatus'];
  saveDisabled: boolean;
  onSave: () => void;
  onRotate: () => void;
  onCopyToken: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const saveLabel =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Error' : 'Save';

  const saveClass =
    status === 'saved'
      ? 'border border-green-400/30 bg-green-500/15 text-green-200'
      : status === 'error'
        ? 'border border-red-400/30 bg-red-500/15 text-red-200'
        : status === 'saving'
          ? 'border border-orange-400/20 bg-orange-500/10 text-orange-200'
          : `${BTN_ACCENT_CLASS}`;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        title="Save settings"
        className={`${BTN_BASE_CLASS} h-9 px-3 ${saveClass}`}
      >
        {status === 'saved' ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{saveLabel}</span>
      </button>

      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Account actions"
          aria-expanded={open}
          className={`${BTN_BASE_CLASS} ${BTN_GHOST_CLASS} h-9 w-9`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-[200] mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f14] p-1.5 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => {
                onCopyToken();
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Clipboard className="h-3.5 w-3.5" />}
              <span>{copied ? 'Token copied' : 'Copy token'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onRotate();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Rotate token</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkspaceNav({ refs, state, actions, onOpenRotateModal }: WorkspaceNavProps) {
  const { navRef } = refs;
  const { previewType, mediaId, lang, supportedLanguages, tmdbKey } = state;
  const { setPreviewType, setMediaId, setLang, handleSaveConfig, handleTokenDisconnect } = actions;
  const langOptions = supportedLanguages.map((l: { code: string; flag: string; label: string }) => ({
    id: l.code,
    label: `${l.flag} ${l.label}`,
  }));

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 shrink-0 rounded-[22px] border border-white/10 bg-[#06070b]/85 px-2.5 py-2 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl xl:static"
    >
      <div className="flex flex-wrap items-center gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            aria-label="Back to home"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="hidden font-[var(--font-display)] text-[13px] font-semibold tracking-tight text-white md:block">
            ERDB
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          {tmdbKey ? (
            <LanguagePicker lang={lang} options={langOptions} onChange={setLang} className="w-32 max-w-[38vw]" />
          ) : (
            <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-[#080808] px-2.5 text-[10px] text-slate-500">
              <Globe2 className="h-3 w-3 shrink-0" />
              <span>No key</span>
            </div>
          )}
          {state.activeToken ? (
            <AccountMenu
              status={state.configSaveStatus}
              saveDisabled={state.configSaveStatus === 'saving'}
              onSave={handleSaveConfig}
              onRotate={onOpenRotateModal}
              onCopyToken={() => navigator.clipboard.writeText(state.activeToken!)}
              onLogout={handleTokenDisconnect}
            />
          ) : (
            <Link
              href="/configurator"
              className={`${BTN_BASE_CLASS} ${BTN_GHOST_CLASS} h-9 px-3 text-[11px]`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Sign in</span>
            </Link>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center lg:gap-2">
          <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1 lg:w-auto">
            {PREVIEW_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = previewType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setPreviewType(type.id)}
                  aria-pressed={isActive}
                  className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'border border-orange-400/20 bg-orange-500/10 text-white shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex w-full items-center gap-2 lg:w-auto">
            <MediaIdSearch mediaId={mediaId} setMediaId={setMediaId} tmdbKey={tmdbKey} previewType={previewType} />
            {tmdbKey ? (
              <LanguagePicker lang={lang} options={langOptions} onChange={setLang} className="hidden lg:block" />
            ) : (
              <div className="hidden h-9 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-[#080808] px-2.5 text-[10px] text-slate-500 lg:flex">
                <Globe2 className="h-3 w-3 shrink-0" />
                <span>No TMDB key</span>
              </div>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex lg:justify-end">
          {state.activeToken ? (
            <AccountMenu
              status={state.configSaveStatus}
              saveDisabled={state.configSaveStatus === 'saving'}
              onSave={handleSaveConfig}
              onRotate={onOpenRotateModal}
              onCopyToken={() => navigator.clipboard.writeText(state.activeToken!)}
              onLogout={handleTokenDisconnect}
            />
          ) : (
            <Link href="/configurator" className={`${BTN_BASE_CLASS} ${BTN_GHOST_CLASS} h-9 px-3.5`}>
              <Lock className="h-3.5 w-3.5" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
