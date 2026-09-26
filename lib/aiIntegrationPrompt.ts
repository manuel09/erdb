export const ERDB_AI_INTEGRATION_PROMPT = `Act as an expert media center addon developer. I want to implement ERDB into my addon to provide enhanced posters, backdrops, logos, and thumbnails with rating badges and stream quality overlays.

### --- CONFIG INPUT ---
Add a single text configuration field called "erdbToken".
The user will paste their ERDB token from the configurator after logging in.

Also add an optional text configuration field called "erdbBaseUrl".
Use this ERDB base URL by default:
https://easyratingsdb.com

The addon must allow advanced users to change the ERDB base URL, but it should default to \`https://easyratingsdb.com\`.
It must also normalize the base URL automatically so both \`https://easyratingsdb.com\` and \`https://easyratingsdb.com/\` work correctly.

Do NOT ask for TMDB keys, MDBList keys, layout fields, or rating provider lists inside the addon UI.
Those settings are already stored server-side behind the token.

### --- API MODEL ---
ERDB is now token-based for renderer URLs.

**Renderer endpoint:**
GET {erdbBaseUrl}/{erdbToken}/{type}/{kind}/{id}.jpg

Path parameter | Values
--- | ---
erdbBaseUrl | Defaults to https://easyratingsdb.com but should be user-configurable
erdbToken | Tk-...
type | poster, backdrop, logo, thumbnail
kind | movie or series (optional as a path segment or ?type= query param; anime is accepted and ignored; legacy URLs without kind still work)
shape | poster or landscape (optional; poster-only, landscape forces the backdrop-as-poster rendering; square is not supported)
id | IMDb (tt...), TMDB (tmdb:id), TVDB episode IDs, Kitsu, AniList, MAL

All visual settings, provider choices, API keys, language defaults, layouts, and badge options are resolved from the token on the server.

### --- COMMON URL PATTERNS ---
Use these patterns directly if you are not generating the integration from the ERDB workspace UI:

Pattern | Use case
--- | ---
{erdbBaseUrl}/{erdbToken}/poster/movie/{imdbId}.jpg | Movie poster
{erdbBaseUrl}/{erdbToken}/poster/series/{imdbId}.jpg | Series poster
{erdbBaseUrl}/{erdbToken}/backdrop/movie/{imdbId}.jpg | Movie backdrop
{erdbBaseUrl}/{erdbToken}/backdrop/series/{imdbId}.jpg | Series backdrop
{erdbBaseUrl}/{erdbToken}/logo/movie/{imdbId}.jpg | Movie logo
{erdbBaseUrl}/{erdbToken}/logo/series/{imdbId}.jpg | Series logo
{erdbBaseUrl}/{erdbToken}/thumbnail/series/{seriesImdbId}:{season}:{episode}.jpg | Episode thumbnail with IMDb episode addressing
{erdbBaseUrl}/{erdbToken}/thumbnail/series/realimdb:{seriesImdbId}:{season}:{episode}.jpg | Episode thumbnail when the addon uses real IMDb TV metadata
{erdbBaseUrl}/{erdbToken}/thumbnail/series/tvdb:{tvdbId}:{season}:{episode}.jpg | Episode thumbnail when the addon uses TVDB numbering
{erdbBaseUrl}/{erdbToken}/poster/movie/tmdb:{tmdbId}.jpg | Movie poster when only TMDB movie ID is available
{erdbBaseUrl}/{erdbToken}/backdrop/series/tmdb:{tmdbId}.jpg | Series backdrop when only TMDB TV ID is available

### --- INTEGRATION REQUIREMENTS ---
1. Minimal UI: Use \`erdbToken\` and optionally \`erdbBaseUrl\` with default \`https://easyratingsdb.com\`.
2. Artwork Toggles: Provide optional toggles to enable or disable ERDB for posters, backdrops, logos, and thumbnails.
3. Smart Fallback: If ERDB is disabled for a type, or if the token is missing, keep the original artwork URL.
4. URL Building: Use \`erdbBaseUrl\` when provided, otherwise default to \`https://easyratingsdb.com\`, then append token, type, and media id.
   Normalize trailing slashes automatically before building renderer URLs.
5. Preserve Existing IDs: Do not rewrite IDs unless your addon already has a normalization layer.

### --- URL BUILD LOGIC ---
function buildErdbUrl({ erdbToken, erdbBaseUrl = 'https://easyratingsdb.com', type, kind, id }) {
  if (!erdbToken || !type || !id || !erdbBaseUrl) {
    return null;
  }

  const baseUrl = erdbBaseUrl.replace(/\/+$/, '');
  const kindSegment = kind === 'movie' || kind === 'series' ? \`/\${kind}\` : '';
  return \`\${baseUrl}/\${erdbToken}/\${type}\${kindSegment}/\${id}.jpg\`;
}

### --- EXAMPLES ---
Movie poster:
\`\`\`
https://easyratingsdb.com/Tk-abc123/poster/movie/tt0133093.jpg
\`\`\`

Series backdrop:
\`\`\`
https://easyratingsdb.com/Tk-abc123/backdrop/series/tt0944947.jpg
\`\`\`

Episode thumbnail:
\`\`\`
https://easyratingsdb.com/Tk-abc123/thumbnail/series/tt0944947:1:1.jpg
\`\`\`

If the addon uses real IMDb TV metadata for episodes and thumbnails, use the \`realimdb:\` prefix for the episode id.
Example:
\`\`\`
https://easyratingsdb.com/Tk-abc123/thumbnail/series/realimdb:tt0944947:1:1.jpg
\`\`\`

### --- PROXY NOTE ---
If you also integrate the ERDB proxy manifest, keep that as a separate feature.
For artwork rendering, the addon should not append TMDB, MDBList, SIMKL, style, or layout query parameters when a token is available.
Default the base URL to \`https://easyratingsdb.com\`, but keep it user-configurable for self-hosted ERDB instances.
Handle base URLs with or without a trailing slash automatically.
`;
