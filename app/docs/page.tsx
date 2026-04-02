import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Code2, FileJson, ImageIcon, Layers3, Workflow } from 'lucide-react';
import { RATING_PROVIDER_OPTIONS } from '@/lib/ratingPreferences';
import { POSTER_RATING_LAYOUT_OPTIONS } from '@/lib/posterRatingLayout';
import { BACKDROP_RATING_LAYOUT_OPTIONS } from '@/lib/backdropRatingLayout';
import { THUMBNAIL_RATING_LAYOUT_OPTIONS } from '@/lib/thumbnailRatingLayout';
import { THUMBNAIL_SIZE_OPTIONS } from '@/lib/thumbnailSize';
import { RATING_STYLE_OPTIONS } from '@/lib/ratingStyle';

export const metadata: Metadata = {
  title: 'ERDB API Docs',
  description: 'Dedicated documentation for the ERDB renderer, proxy, and helper endpoints.',
};

const providers = RATING_PROVIDER_OPTIONS.map((provider) => provider.id).join(', ');
const styles = RATING_STYLE_OPTIONS.map((option) => option.id).join(', ');
const posterLayouts = POSTER_RATING_LAYOUT_OPTIONS.map((option) => option.id).join(', ');
const backdropLayouts = BACKDROP_RATING_LAYOUT_OPTIONS.map((option) => option.id).join(', ');
const thumbnailLayouts = THUMBNAIL_RATING_LAYOUT_OPTIONS.map((option) => option.id).join(', ');
const thumbnailSizes = THUMBNAIL_SIZE_OPTIONS.map((option) => option.id).join(', ');

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[12px] text-orange-300">{children}</code>;
}

function Table({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0a0f16]/90">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-white/[0.04] text-[11px] uppercase tracking-[0.22em] text-slate-500">
            {columns.map((column) => (
              <th key={column} className="px-5 py-3 font-semibold">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/6">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-5 py-4 text-slate-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-slate-400">
          {icon}
          <span>{title}</span>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070b] text-slate-200 font-[var(--font-body)] selection:bg-orange-400/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_38%),radial-gradient(circle_at_80%_24%,_rgba(59,130,246,0.10),_transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-[#05070b]/80 px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to ERDB</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/configurator" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Open Configurator</Link>
            <a href="https://github.com/realbestia1/erdb" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200">
              <span>GitHub</span>
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </header>

        <div className="space-y-10">
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-slate-300">
              <Workflow className="h-3.5 w-3.5 text-orange-300" />
              <span>Dedicated API Docs</span>
            </div>
            <h1 className="max-w-5xl text-4xl leading-tight text-white sm:text-5xl">
              ERDB renderer, proxy, helper endpoints, and the real query surface.
            </h1>
            <p className="max-w-4xl text-base leading-8 text-slate-400">
              This page documents the routes that actually exist in the codebase. The big correction
              versus the old inline docs is simple: <Code>tmdbKey</Code> is always required for the renderer,
              while <Code>mdblistKey</Code> is optional there but required by proxy config validation.
            </p>
          </section>

          <Section icon={<Code2 className="h-3.5 w-3.5 text-orange-300" />} title="Public Endpoints" description="Main public surface exposed by the app.">
            <Table
              columns={['Method', 'Path', 'Purpose', 'Notes']}
              rows={[
                [<Code key="1">GET</Code>, <Code key="2">/{'{type}'}/{'{id}'}.jpg</Code>, 'Stateless poster/backdrop/logo/thumbnail rendering.', 'Main image API. Logos still use a .jpg path but return PNG.'],
                [<Code key="3">GET</Code>, <Code key="4">/api/version</Code>, 'Returns currentVersion, githubPackageVersion, and repoUrl.', 'Useful for self-hosted version checks.'],
                [<Code key="5">GET</Code>, <Code key="6">/api/proxy-manifest?url=...</Code>, 'Inspects a source manifest and returns normalized catalog descriptors.', 'Used by the configurator.'],
                [<Code key="7">GET</Code>, <Code key="8">/proxy/manifest.json?url=...&tmdbKey=...&mdblistKey=...</Code>, 'Query-config proxy manifest.', 'Fast test path with CORS enabled.'],
                [<Code key="9">GET</Code>, <Code key="10">/proxy/{'{config}'}/manifest.json</Code>, 'Path-config proxy manifest.', 'Preferred stable production form.'],
                [<Code key="11">GET</Code>, <Code key="12">/proxy/{'{config}'}/{'{resource...}'}</Code>, 'Forwards addon traffic and rewrites artwork to ERDB URLs.', 'Catalog/meta JSON are rewritten; other resources pass through.'],
              ]}
            />
          </Section>

          <Section icon={<ImageIcon className="h-3.5 w-3.5 text-orange-300" />} title="Image Renderer" description="Canonical route: GET /{type}/{id}.jpg">
            <Table
              columns={['Field', 'Values', 'Default', 'Notes']}
              rows={[
                [<Code key="tmdbKey">tmdbKey</Code>, 'TMDB v3 API key', 'required', 'Hard requirement. Alias: tmdb_key.'],
                [<Code key="mdblistKey">mdblistKey</Code>, 'MDBList API key', 'optional', 'Needed for MDBList ratings unless the server already has MDBLIST_API_KEY(S). Alias: mdblist_key.'],
                [<Code key="simkl">simklClientId</Code>, 'SIMKL client_id', 'optional', 'Only for direct SIMKL ratings. Alias: simkl_client_id.'],
                [<Code key="ratings">ratings</Code>, providers, 'all providers', 'Global provider fallback. Empty string disables ratings.'],
                [<Code key="type">type</Code>, 'poster, backdrop, logo, thumbnail', '-', 'thumbnail is episode-only.'],
                [<Code key="lang">lang</Code>, 'TMDB language code', 'en', 'Examples: en, it, es-ES, pt-BR.'],
                [<Code key="style">ratingStyle</Code>, styles, 'glass, except logo -> plain', 'Alias: style.'],
                [<Code key="imageText">imageText</Code>, 'original, clean, alternative', 'original, except backdrop -> clean', 'Alias: posterText.'],
                [<Code key="posterLayout">posterRatingsLayout</Code>, posterLayouts, 'top-bottom', 'Vertical poster layouts can use posterRatingsMaxPerSide and posterVerticalBadgeContent.'],
                [<Code key="backdropLayout">backdropRatingsLayout</Code>, backdropLayouts, 'center', 'Backdrop-only layout.'],
                [<Code key="thumbLayout">thumbnailRatingsLayout</Code>, thumbnailLayouts, 'center', 'Thumbnail-only layout.'],
                [<Code key="thumbSize">thumbnailSize</Code>, thumbnailSizes, 'medium', 'Thumbnails only support tmdb and imdb ratings.'],
              ]}
            />
            <Table
              columns={['ID format', 'Kind', 'Behavior']}
              rows={[
                [<Code key="id1">tt0133093</Code>, 'IMDb title', 'Movie or series lookup.'],
                [<Code key="id2">tt0944947:1:1</Code>, 'IMDb episode', 'Series IMDb ID plus season and episode.'],
                [<Code key="id3">tmdb:603</Code>, 'TMDB inferred', 'Works, but tmdb:movie:603 or tmdb:tv:1399 is preferred.'],
                [<Code key="id4">tmdb:tv:1399:1:1</Code>, 'TMDB episode', 'Explicit TV episode lookup.'],
                [<Code key="id5">tvdb:121361:1:1</Code>, 'TVDB aired-order episode', 'Useful for bridged episode numbering.'],
                [<Code key="id6">realimdb:tt0944947:1:1</Code>, 'IMDb TV bridge', 'Use this when the addon really sources series or episode metadata from IMDb IDs and you want ERDB to keep that IMDb-oriented TV resolution.'],
                [<Code key="id7">kitsu:1</Code>, 'Kitsu anime', 'Anime-native mapping flow.'],
                [<Code key="id8">anilist:16498 / mal:5114 / anidb:69</Code>, 'Anime-native IDs', 'Enable anime-only provider paths.'],
              ]}
            />
            <div className="rounded-3xl border border-white/10 bg-[#0a0f16]/90 p-5 text-sm leading-7 text-slate-400">
              <p><Code>thumbnailRatings</Code> falls back to <Code>thumbnailRatings</Code> -&gt; <Code>backdropRatings</Code> -&gt; <Code>ratings</Code>.</p>
              <p><Code>posterStreamBadges</Code> and <Code>backdropStreamBadges</Code> fall back to <Code>streamBadges</Code>.</p>
              <p><Code>posterQualityBadgesStyle</Code> and <Code>backdropQualityBadgesStyle</Code> fall back to <Code>qualityBadgesStyle</Code>.</p>
              <p><Code>verticalBadgeContent</Code> is accepted as a generic fallback for the type-specific vertical badge params.</p>
              <p>Poster/backdrop/thumbnail negotiate WebP vs JPEG via <Code>Accept</Code>; logos always return <Code>image/png</Code>.</p>
            </div>
            <pre className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0a0f16]/90 p-5 text-[12px] leading-6 text-slate-200"><code>{`GET /poster/tmdb:movie:603.jpg?tmdbKey=YOUR_TMDB_KEY&ratings=tmdb,imdb&posterRatingsLayout=top-bottom&ratingStyle=glass
GET /thumbnail/tt0944947:1:1.jpg?tmdbKey=YOUR_TMDB_KEY&thumbnailRatings=tmdb,imdb&thumbnailRatingsLayout=center-bottom&thumbnailSize=large`}</code></pre>
          </Section>

          <Section icon={<Layers3 className="h-3.5 w-3.5 text-orange-300" />} title="Addon Proxy" description="Proxy config can live in query parameters for testing or inside a base64url JSON path segment for production.">
            <Table
              columns={['Field', 'Required', 'Notes']}
              rows={[
                [<Code key="url">url</Code>, 'yes', 'Absolute source manifest URL.'],
                [<Code key="ptmdb">tmdbKey</Code>, 'yes', 'Required by proxy config validation.'],
                [<Code key="pmdb">mdblistKey</Code>, 'yes', 'Required by proxy config validation even if renderer-only requests can omit it.'],
                [<Code key="toggles">posterEnabled / backdropEnabled / logoEnabled / thumbnailEnabled</Code>, 'no', 'False keeps original artwork for that type.'],
                [<Code key="translate">translateMeta</Code>, 'no', 'Localizes metadata through TMDB when lang is available.'],
                [<Code key="proxyFields">ratings, per-type ratings, styles, layouts, badge settings</Code>, 'no', 'Same semantics as the image renderer.'],
                [<Code key="seriesProvider">seriesMetadataProvider / aiometadataProvider</Code>, 'no', 'Controls TV ID normalization for tricky addon flows, especially addons that actually expose IMDb-based series metadata and should therefore use realimdb-style resolution.'],
                [<Code key="catalog">catalogNames / hiddenCatalogs / searchDisabledCatalogs / discoverOnlyCatalogs</Code>, 'no', 'Catalog customization maps and arrays.'],
                [<Code key="erdbBase">erdbBase</Code>, 'no', 'Overrides the absolute ERDB base used in generated artwork URLs.'],
              ]}
            />
            <pre className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0a0f16]/90 p-5 text-[12px] leading-6 text-slate-200"><code>{`GET /proxy/manifest.json?url=https://addon.example.com/manifest.json&tmdbKey=YOUR_TMDB_KEY&mdblistKey=YOUR_MDBLIST_KEY
GET /proxy/{base64url(jsonConfig)}/manifest.json
GET /proxy/{base64url(jsonConfig)}/catalog/movie/top.json`}</code></pre>
          </Section>

          <Section icon={<FileJson className="h-3.5 w-3.5 text-orange-300" />} title="Helpers And Headers" description="Useful integration details that are easy to miss when wiring ERDB behind another proxy or CDN.">
            <Table
              columns={['Topic', 'Behavior']}
              rows={[
                [<Code key="version">/api/version</Code>, 'Returns currentVersion, githubPackageVersion, and repoUrl.'],
                [<Code key="proxyManifest">/api/proxy-manifest</Code>, 'Returns normalized catalog descriptors including key, extraKeys, supportsSearch, searchRequired, and discoverOnly.'],
                [<Code key="vary">Vary: Accept</Code>, 'Important for caching poster/backdrop/thumbnail responses.'],
                [<Code key="cache">X-ERDB-Cache</Code>, 'Image responses expose hit, miss, or shared.'],
                [<Code key="timing">Server-Timing</Code>, 'Image responses expose auth, tmdb, mdb, stream, render, and total timing phases.'],
                [<Code key="cors">Proxy CORS</Code>, 'Proxy routes and /proxy/manifest.json send Access-Control-Allow-Origin: * and support OPTIONS.'],
              ]}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
