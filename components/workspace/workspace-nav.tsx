'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Save, Check, Clipboard, RefreshCcw, LogOut, Lock, Globe2,
  ChevronRight, Image as ImageIcon, MonitorPlay, Layers, Search, Tv, Film, X, Loader2,
} from 'lucide-react';
import type { HomePageViewProps } from '@/components/workspace/types';
import { Dropdown } from './dropdown';

const SEGMENT_CLASS =
  'flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
const INPUT_COMPACT_CLASS =
  'rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition duration-200 focus:border-orange-400/50 focus:bg-white/[0.07]';

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
  placeholder,
  previewType,
}: {
  mediaId: string;
  setMediaId: (value: string) => void;
  tmdbKey: string;
  placeholder: string;
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

  // Sync external changes to inputValue
  useEffect(() => {
    if (!isSearchMode) {
      setInputValue(mediaId);
    }
  }, [mediaId, isSearchMode]);

  // Close dropdown on outside click
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

    // Detect search mode: if it doesn't look like an IMDB/tt ID pattern, trigger search
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

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tmdbKey ? `${placeholder} or title…` : placeholder}
          className={`h-8 w-32 pr-14 sm:w-44 ${INPUT_COMPACT_CLASS}`}
        />
        {/* Clear button */}
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-7 flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:text-slate-300"
            tabIndex={-1}
            title="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {/* Search / Loading button */}
        <button
          onClick={handleSearchIconClick}
          disabled={!tmdbKey}
          className={`absolute right-1.5 flex h-5 w-5 items-center justify-center rounded-md transition ${tmdbKey ? 'text-slate-400 hover:text-orange-300' : 'cursor-not-allowed text-slate-600'}`}
          tabIndex={-1}
          title={tmdbKey ? 'Search by title' : 'Add TMDB key to enable search'}
        >
          {isSearching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Search className="h-3 w-3" />
          )}
        </button>

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute left-0 top-full z-[200] mt-1.5 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f14] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
            <div className="px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Select a result
            </div>
            <div className="max-h-72 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.tmdbId}
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] cursor-pointer"
                >
                  {/* Poster */}
                  <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                    {r.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.poster} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        {r.type === 'movie' ? (
                          <Film className="h-3 w-3" />
                        ) : (
                          <Tv className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-white">{r.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {r.year && (
                        <span className="text-[10px] text-slate-500">{r.year}</span>
                      )}
                      <span
                        className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          r.type === 'movie'
                            ? 'bg-orange-500/15 text-orange-300'
                            : 'bg-sky-500/15 text-sky-300'
                        }`}
                      >
                        {r.type === 'movie' ? 'Movie' : 'TV'}
                      </span>
                    </div>
                  </div>
                  {/* ID badge */}
                  <div className="shrink-0">
                    {r.imdbId ? (
                      <span className="rounded-lg border border-teal-400/20 bg-teal-500/10 px-2 py-0.5 text-[9px] font-mono text-teal-300">
                        {r.imdbId}
                      </span>
                    ) : (
                      <span className="rounded-lg border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 text-[9px] font-mono text-orange-300">
                        tmdb:{r.tmdbId}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {results.length === 0 && !isSearching && (
              <div className="px-3 py-4 text-center text-xs text-slate-500">No results found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkspaceNav({ refs, state, actions, derived, onOpenRotateModal }: WorkspaceNavProps) {
  const { navRef } = refs;
  const { previewType, mediaId, lang, supportedLanguages, tmdbKey } = state;
  const { setPreviewType, setMediaId, setLang, handleSaveConfig, handleTokenDisconnect } = actions;
  const [tokenCopied, setTokenCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langOptions = supportedLanguages.map((l: { code: string; flag: string; label: string }) => ({ id: l.code, label: `${l.flag} ${l.label}` }));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav ref={navRef} className="sticky top-0 z-50 rounded-[28px] border border-white/10 bg-[#06070b]/72 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl xl:static">
      <div className="mx-auto flex w-full flex-col gap-1 px-3 py-1.5 sm:px-4 sm:py-3 lg:flex-row lg:items-center lg:gap-3">
        {/* Desktop: Home always left */}
        <Link href="/" className="hidden shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white lg:flex">
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        {state.activeToken && (
          <button onClick={handleTokenDisconnect}
            className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:flex" title="Logout">
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        )}
        {!state.activeToken && (
          <Link href="/configurator" className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-slate-100 transition-colors hover:bg-white/10 lg:flex">
            <Lock className="h-3.5 w-3.5" />
            <span>Login</span>
          </Link>
        )}

        {/* Center group: Type + Media ID + Lang (desktop) / Mobile Row 1 */}
        <div className="flex flex-col gap-1 lg:mx-auto lg:flex-row lg:items-center lg:gap-3">
          <div className="flex items-center justify-center gap-1">
            <div className={`${SEGMENT_CLASS} flex max-w-full gap-0.5 overflow-x-auto px-0.5 py-0`}>
            {(['poster', 'backdrop', 'logo', 'thumbnail'] as const).map(type => (
              <button
                key={type}
                onClick={() => setPreviewType(type)}
                className={`flex h-8 shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap transition-all sm:px-2 sm:py-1 sm:text-[11px] ${
                  previewType === type
                    ? 'border border-orange-400/20 bg-orange-500/10 text-white shadow-sm'
                    : 'border border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {type === 'poster' && <ImageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                {type === 'backdrop' && <MonitorPlay className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                {type === 'logo' && <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                {type === 'thumbnail' && <MonitorPlay className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                <span>{type === 'backdrop' ? 'Backdrp' : type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </button>
            ))}
          </div>
          {/* Desktop: Media ID + Lang inline after type */}
          <div className="hidden items-center gap-2 lg:flex">
            <MediaIdSearch
              mediaId={mediaId}
              setMediaId={setMediaId}
              tmdbKey={tmdbKey}
              placeholder={previewType === 'thumbnail' ? 'tt0944947:1:1' : 'tt0133093'}
              previewType={previewType}
            />
            {tmdbKey ? (
              <Dropdown value={lang} onChange={setLang} options={langOptions} className="h-8 text-[13px]" />
            ) : (
              <div className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-[#080808] px-2 text-[10px] text-slate-500">
                <Globe2 className="h-3 w-3 shrink-0" />
                <span>No key</span>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Desktop right section: actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {state.activeToken && (
            <button onClick={handleSaveConfig} disabled={state.configSaveStatus === 'saving'}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                state.configSaveStatus === 'saved' ? 'border-green-400/30 bg-green-500/15 text-green-200'
                : state.configSaveStatus === 'error' ? 'border-red-400/30 bg-red-500/15 text-red-200'
                : state.configSaveStatus === 'saving' ? 'border-orange-400/20 bg-orange-500/10 text-orange-200 cursor-wait'
                : 'border-orange-400/20 bg-orange-500/10 text-white hover:bg-orange-500/20'}`}
              title="Save Settings">
              {state.configSaveStatus === 'saved' ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              <span>{state.configSaveStatus === 'saving' ? 'Saving…' : state.configSaveStatus === 'saved' ? 'Saved' : state.configSaveStatus === 'error' ? 'Error' : 'Save Settings'}</span>
            </button>
          )}
          {state.activeToken && (
            <button onClick={() => { navigator.clipboard.writeText(state.activeToken!); setTokenCopied(true); setTimeout(() => setTokenCopied(false), 2000); }}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white" title="Copy Token">
              <Clipboard className="h-3.5 w-3.5" />
              <span>Copy Token</span>
            </button>
          )}
          {state.activeToken && (
            <button onClick={onOpenRotateModal}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white" title="Rotate Token">
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Rotate Token</span>
            </button>
          )}
        </div>

        {/* Mobile: Row 2 = Home + Media ID + Lang + compact actions (hidden on desktop) */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/" className={`flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white sm:px-2 sm:py-1.5 sm:text-[11px] h-8 sm:py-0 ${scrolled ? 'opacity-0 invisible w-0 overflow-hidden px-0' : ''}`}>
            <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
          <div className="mx-auto flex items-center gap-2">
            <MediaIdSearch
              mediaId={mediaId}
              setMediaId={setMediaId}
              tmdbKey={tmdbKey}
              placeholder={previewType === 'thumbnail' ? 'tt0944947:1:1' : 'tt0133093'}
              previewType={previewType}
            />
            {tmdbKey ? (
              <Dropdown value={lang} onChange={setLang} options={langOptions} className="h-8 px-2 py-1 text-[10px] sm:px-2.5 sm:py-1.5 sm:text-[13px]" />
            ) : (
              <div className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-[#080808] px-1.5 text-[9px] text-slate-500 sm:px-2 sm:text-[10px]">
                <Globe2 className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                <span>No key</span>
              </div>
            )}
          </div>
          <div className={`flex shrink-0 items-center gap-1 ml-auto transition-all duration-200 ${scrolled ? 'flex' : 'hidden'}`}>
            {state.activeToken && (
              <button onClick={handleSaveConfig} disabled={state.configSaveStatus === 'saving'}
                className={`rounded-full border p-1 text-[8px] transition-colors ${
                  state.configSaveStatus === 'saved' ? 'border-green-400/30 bg-green-500/15 text-green-200'
                  : state.configSaveStatus === 'error' ? 'border-red-400/30 bg-red-500/15 text-red-200'
                  : 'border-orange-400/20 bg-orange-500/10 text-white'}`}
                title="Save Settings">
                {state.configSaveStatus === 'saved' ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
              </button>
            )}
            {state.activeToken && (
              <button onClick={() => { navigator.clipboard.writeText(state.activeToken!); setTokenCopied(true); setTimeout(() => setTokenCopied(false), 2000); }}
                className="rounded-full border border-white/10 bg-white/[0.04] p-1 text-slate-400" title="Copy Token">
                {tokenCopied ? <Check className="h-3 w-3 text-green-400" /> : <Clipboard className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile: Row 3 = Action buttons full size (only when not scrolled) */}
        <div className={`flex items-center gap-1.5 transition-all duration-200 lg:hidden ${scrolled ? 'h-0 overflow-hidden opacity-0' : ''}`}>
          {state.activeToken && (
            <button onClick={handleSaveConfig} disabled={state.configSaveStatus === 'saving'}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-medium transition-colors sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px] ${
                state.configSaveStatus === 'saved' ? 'border-green-400/30 bg-green-500/15 text-green-200'
                : state.configSaveStatus === 'error' ? 'border-red-400/30 bg-red-500/15 text-red-200'
                : state.configSaveStatus === 'saving' ? 'border-orange-400/20 bg-orange-500/10 text-orange-200 cursor-wait'
                : 'border-orange-400/20 bg-orange-500/10 text-white hover:bg-orange-500/20'}`}
              title="Save Settings">
              {state.configSaveStatus === 'saved' ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
              <span>{state.configSaveStatus === 'saving' ? 'Saving…' : state.configSaveStatus === 'saved' ? 'Saved' : state.configSaveStatus === 'error' ? 'Error' : 'Save Settings'}</span>
            </button>
          )}
          {state.activeToken && (
            <button onClick={() => { navigator.clipboard.writeText(state.activeToken!); setTokenCopied(true); setTimeout(() => setTokenCopied(false), 2000); }}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px]" title="Copy Token">
              {tokenCopied ? <Check className="h-3 w-3 text-green-400" /> : <Clipboard className="h-3 w-3" />}
              <span>{tokenCopied ? 'Copied' : 'Copy Token'}</span>
            </button>
          )}
          {state.activeToken && (
            <button onClick={onOpenRotateModal}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px]" title="Rotate Token">
              <RefreshCcw className="h-3 w-3" />
              <span>Rotate Token</span>
            </button>
          )}
          {state.activeToken && (
            <button onClick={handleTokenDisconnect}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px]" title="Logout">
              <LogOut className="h-3 w-3" />
              <span>Logout</span>
            </button>
          )}
          {!state.activeToken && (
            <Link href="/configurator" className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-medium text-slate-100 transition-colors hover:bg-white/10 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px]">
              <Lock className="h-3 w-3" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
