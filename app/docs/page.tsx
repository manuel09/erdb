import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Bot, Code2, FileJson, ImageIcon, Workflow } from 'lucide-react';
import { DocsCopyPromptButton } from '@/components/docs-copy-prompt-button';
import { ERDB_AI_INTEGRATION_PROMPT } from '@/lib/aiIntegrationPrompt';
import { RATING_PROVIDER_OPTIONS } from '@/lib/ratingPreferences';
import { POSTER_RATING_LAYOUT_OPTIONS } from '@/lib/posterRatingLayout';
import { BACKDROP_RATING_LAYOUT_OPTIONS } from '@/lib/backdropRatingLayout';
import { THUMBNAIL_RATING_LAYOUT_OPTIONS } from '@/lib/thumbnailRatingLayout';
import { THUMBNAIL_SIZE_OPTIONS } from '@/lib/thumbnailSize';
import { RATING_STYLE_OPTIONS } from '@/lib/ratingStyle';
import { LOGO_FONT_VARIANT_OPTIONS } from '@/lib/logoFontVariant';
import { LOGO_MODE_OPTIONS } from '@/lib/logoMode';

export const metadata: Metadata = {
  title: 'ERDB API Docs',
  description: 'Dedicated documentation for the ERDB renderer and helper endpoints.',
};

const providers = RATING_PROVIDER_OPTIONS.map((provider) => provider.id).join(', ');
const styles = RATING_STYLE_OPTIONS.map((option) => option.id).join(', ');
const posterLayouts = POSTER_RATING_LAYOUT_OPTIONS.map((option) => option.id).join(', ');
const backdropLayouts = BACKDROP_RATING_LAYOUT_OPTIONS.map((option) => option.id).join(', ');
const thumbnailLayouts = THUMBNAIL_RATING_LAYOUT_OPTIONS.map((option) => option.id).join(', ');
const thumbnailSizes = THUMBNAIL_SIZE_OPTIONS.map((option) => option.id).join(', ');
const logoFonts = LOGO_FONT_VARIANT_OPTIONS.map((option) => option.id).join(', ');
const logoModes = LOGO_MODE_OPTIONS.map((option) => option.id).join(', ');

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
              ERDB renderer, helper endpoints, and the real query surface.
            </h1>
            <p className="max-w-4xl text-base leading-8 text-slate-400">
              This page documents the routes that actually exist in the codebase. The important change
              is simple: ERDB now uses a secure, persistent <strong>token-based account system</strong>.
              Instead of passing TMDB keys, MDBList keys, layouts, and provider settings in every request,
              you use your <Code>Tk-...</Code> token and ERDB resolves the saved configuration server-side.
            </p>
            <p className="max-w-4xl text-sm leading-7 text-slate-500">
              For addon integrations, default to <Code>https://easyratingsdb.com</Code> but allow advanced users to override the ERDB base URL for self-hosted instances. The integration should normalize the base URL automatically so it works with or without a trailing slash.
            </p>
          </section>

          <Section icon={<Code2 className="h-3.5 w-3.5 text-orange-300" />} title="Public Endpoints" description="Main public surface exposed by the app.">
            <Table
              columns={['Method', 'Path', 'Purpose', 'Notes']}
              rows={[
                [<Code key="1">GET</Code>, <Code key="2">/{'{token}'}/{'{type}'}/{'{id}'}.jpg</Code>, 'Token-based poster/backdrop/logo/thumbnail rendering.', 'Main image API. Resolves configurations via accounts.db.'],
                [<Code key="3">POST</Code>, <Code key="4">/api/workspace-auth</Code>, 'Login, register, and logout for the workspace.', 'Cookie-based session for /configurator.'],
                [<Code key="5">POST</Code>, <Code key="6">/api/token</Code>, 'Create a new token with the current settings.', 'Used by the workspace.'],
                [<Code key="7">PUT</Code>, <Code key="8">/api/token</Code>, 'Update settings for an existing token.', 'Requires matching password.'],
                [<Code key="9">GET</Code>, <Code key="10">/api/token?token=...&password=...</Code>, 'Fetch settings for a token.', 'Requires the token password. Used by loaders.'],
                [<Code key="11">GET</Code>, <Code key="12">/api/version</Code>, 'Returns currentVersion, githubPackageVersion, repoUrl.', 'Useful for self-hosted version checks.'],
              ]}
            />
          </Section>

          <Section icon={<ImageIcon className="h-3.5 w-3.5 text-orange-300" />} title="Image Renderer" description="Canonical route: GET /{token}/{type}/{id}.jpg">
            <div className="rounded-3xl border border-white/10 bg-[#0a0f16]/90 p-5 text-sm leading-7 text-slate-400 mb-4">
              <p>The image renderer no longer relies on query strings. All settings, including API keys, layouts, badges, and providers, are stored in the server database and resolved using the provided token.</p>
            </div>
            <Table
              columns={['Field', 'Values', 'Default', 'Notes']}
              rows={[
                [<Code key="token">token</Code>, 'Tk-xxxxxxxxxxxxxxx', 'required', 'Unique account token generated via the UI or /api/token.'],
                [<Code key="type">type</Code>, 'poster, backdrop, logo, thumbnail', '-', 'thumbnail is episode-only.'],
                [<Code key="stored">stored config</Code>, `providers: ${providers}`, 'saved in token', `Saved server-side, including styles (${styles}), layouts (${posterLayouts}; ${backdropLayouts}; ${thumbnailLayouts}), thumbnail sizes (${thumbnailSizes}), logo fonts (${logoFonts}), and logo modes (${logoModes}).`],
                [<Code key="lang">lang behavior</Code>, 'TMDB language code', 'saved in token', 'Usually configured once in the workspace and reused automatically.'],
                [<Code key="overrides">query overrides</Code>, 'not required', 'off', 'Integrations should prefer token-only renderer URLs and avoid per-request config fields.'],
              ]}
            />
            <Table
              columns={['Type', 'Use case', 'Accepted IDs', 'Notes']}
              rows={[
                [<Code key="type-poster">poster</Code>, 'Movie poster or series poster.', 'IMDb, TMDB, TVDB bridge, anime IDs', 'Main vertical artwork endpoint. Works for movies and series.'],
                [<Code key="type-backdrop">backdrop</Code>, 'Movie backdrop or series backdrop.', 'IMDb, TMDB, TVDB bridge, anime IDs', 'Main horizontal hero/background artwork endpoint.'],
                [<Code key="type-logo">logo</Code>, 'Title logo for movies or series.', 'IMDb, TMDB, anime IDs', 'Returns branded logo artwork when available.'],
                [<Code key="type-thumbnail">thumbnail</Code>, 'Episode thumbnail / still frame.', 'Episode-style IDs only', 'Use episode IDs like tt0944947:1:1, tmdb:tv:1399:1:1, tvdb:121361:1:1, or realimdb:tt0944947:1:1.'],
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
            <Table
              columns={['Pattern', 'Use when', 'Example']}
              rows={[
                [<Code key="pattern1">/{'{token}'}/poster/{'{imdbId}'}.jpg</Code>, 'Movie or series posters from IMDb IDs.', <Code key="pattern1ex">/Tk-abc123/poster/tt0133093.jpg</Code>],
                [<Code key="pattern2">/{'{token}'}/backdrop/{'{imdbId}'}.jpg</Code>, 'Movie or series backdrops from IMDb IDs.', <Code key="pattern2ex">/Tk-abc123/backdrop/tt0944947.jpg</Code>],
                [<Code key="pattern3">/{'{token}'}/logo/{'{imdbId}'}.jpg</Code>, 'Movie or series logos from IMDb IDs.', <Code key="pattern3ex">/Tk-abc123/logo/tt0944947.jpg</Code>],
                [<Code key="pattern4">/{'{token}'}/thumbnail/{'{seriesImdbId}'}:{'{season}'}:{'{episode}'}.jpg</Code>, 'Episode thumbnails using IMDb episode addressing.', <Code key="pattern4ex">/Tk-abc123/thumbnail/tt0944947:1:1.jpg</Code>],
                [<Code key="pattern5">/{'{token}'}/thumbnail/realimdb:{'{seriesImdbId}'}:{'{season}'}:{'{episode}'}.jpg</Code>, 'Episode thumbnails when the addon uses real IMDb TV metadata.', <Code key="pattern5ex">/Tk-abc123/thumbnail/realimdb:tt0944947:1:1.jpg</Code>],
                [<Code key="pattern6">/{'{token}'}/thumbnail/tvdb:{'{tvdbId}'}:{'{season}'}:{'{episode}'}.jpg</Code>, 'Episode thumbnails when the addon uses TVDB numbering.', <Code key="pattern6ex">/Tk-abc123/thumbnail/tvdb:121361:1:1.jpg</Code>],
                [<Code key="pattern7">/{'{token}'}/poster/tmdb:movie:{'{tmdbId}'}.jpg</Code>, 'Movie posters when you only have a TMDB movie ID.', <Code key="pattern7ex">/Tk-abc123/poster/tmdb:movie:603.jpg</Code>],
                [<Code key="pattern8">/{'{token}'}/backdrop/tmdb:tv:{'{tmdbId}'}.jpg</Code>, 'Series backdrops when you only have a TMDB TV ID.', <Code key="pattern8ex">/Tk-abc123/backdrop/tmdb:tv:1399.jpg</Code>],
              ]}
            />
            <pre className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0a0f16]/90 p-5 text-[12px] leading-6 text-slate-200"><code>{`GET /Tk-abc123xyz/poster/tt0133093.jpg
GET /Tk-abc123xyz/backdrop/tt0944947.jpg
GET /Tk-abc123xyz/logo/tt0944947.jpg
GET /Tk-abc123xyz/thumbnail/realimdb:tt0944947:1:1.jpg`}</code></pre>
          </Section>

          <Section
            icon={<Bot className="h-3.5 w-3.5 text-orange-300" />}
            title="AI Integration Prompt"
            description="A ready-to-use prompt for wiring ERDB into another addon or media app using the documented config fields and routes."
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#0a0f16]/90 p-5">
              <div className="max-w-3xl text-sm leading-7 text-slate-300">
                <p>
                  This section should be usable as-is: copy the prompt, give it to an AI or developer, and implement the
                  ERDB renderer from a single <Code>ERDB Token</Code> field.
                </p>
                <p>
                  It instructs the AI to default to <Code>{`https://easyratingsdb.com/{token}/{type}/{id}.jpg`}</Code> while keeping the ERDB base URL configurable.
                </p>
              </div>
              <DocsCopyPromptButton prompt={ERDB_AI_INTEGRATION_PROMPT} />
            </div>
            <pre className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0a0f16]/90 p-5 text-[12px] leading-6 text-slate-200"><code>{ERDB_AI_INTEGRATION_PROMPT}</code></pre>
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
