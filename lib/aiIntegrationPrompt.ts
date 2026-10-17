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
id | Any id the addon already has: IMDb (tt...), TMDB (tmdb:id), TVDB (tvdb:...), Kitsu, AniList, MAL. No provider prefix is required for IMDb/TMDB ids.
type (query) | movie or series, passed as ?type=... (anime is accepted and ignored; legacy URLs without it still work)
shape (query) | poster or landscape (optional; poster-only, landscape forces the backdrop-as-poster rendering; square is not supported)

All visual settings, provider choices, API keys, language defaults, layouts, and badge options are resolved from the token on the server.

### --- COMMON URL PATTERNS ---
Use these patterns directly if you are not generating the integration from the ERDB workspace UI:

Pattern | Use case
--- | ---
{erdbBaseUrl}/{erdbToken}/poster/{id}.jpg?type={type} | Movie or series poster
{erdbBaseUrl}/{erdbToken}/poster/{id}.jpg?type={type}&shape={shape} | Poster with a forced shape (poster / landscape)
{erdbBaseUrl}/{erdbToken}/backdrop/{id}.jpg?type={type} | Movie or series backdrop
{erdbBaseUrl}/{erdbToken}/logo/{id}.jpg?type={type} | Movie or series logo
{erdbBaseUrl}/{erdbToken}/thumbnail/{id}:{season}:{episode}.jpg?type={type} | Episode thumbnail

### --- INTEGRATION REQUIREMENTS ---
1. Minimal UI: Use \`erdbToken\` and optionally \`erdbBaseUrl\` with default \`https://easyratingsdb.com\`.
2. Artwork Toggles: Provide optional toggles to enable or disable ERDB for posters, backdrops, logos, and thumbnails.
3. Smart Fallback: If ERDB is disabled for a type, or if the token is missing, keep the original artwork URL.
4. URL Building: Use \`erdbBaseUrl\` when provided, otherwise default to \`https://easyratingsdb.com\`, then append token, type, and media id.
   Normalize trailing slashes automatically before building renderer URLs.
5. Preserve Existing IDs: Do not rewrite IDs unless your addon already has a normalization layer.

### --- URL BUILD LOGIC ---
function buildErdbUrl({ erdbToken, erdbBaseUrl = 'https://easyratingsdb.com', type, id, mediaType, season, episode }) {
  if (!erdbToken || !type || !id || !erdbBaseUrl) {
    return null;
  }

  const baseUrl = erdbBaseUrl.replace(/\/+$/, '');
  // Episode thumbnails address the episode directly on the id.
  const idPart = season != null && episode != null ? \`\${id}:\${season}:\${episode}\` : id;
  const query = mediaType === 'movie' || mediaType === 'series' ? \`?type=\${mediaType}\` : '';
  return \`\${baseUrl}/\${erdbToken}/\${type}/\${idPart}.jpg\${query}\`;
}

### --- EXAMPLES ---
Movie poster:
\`\`\`
https://easyratingsdb.com/Tk-abc123/poster/tt0133093.jpg?type=movie
\`\`\`

Series backdrop:
\`\`\`
https://easyratingsdb.com/Tk-abc123/backdrop/tt0944947.jpg?type=series
\`\`\`

Episode thumbnail:
\`\`\`
https://easyratingsdb.com/Tk-abc123/thumbnail/tt0944947:1:1.jpg?type=series
\`\`\`

The \`{id}\` is whatever the addon already has. Pass TMDB, TVDB or episode-numbering ids with their prefix (for example \`tmdb:1399\`, \`tvdb:121361:1:1\`) only when the plain IMDb id is not available.

### --- PROXY NOTE ---
If you also integrate the ERDB proxy manifest, keep that as a separate feature.
For artwork rendering, the addon should not append TMDB, MDBList, SIMKL, style, or layout query parameters when a token is available.
Default the base URL to \`https://easyratingsdb.com\`, but keep it user-configurable for self-hosted ERDB instances.
Handle base URLs with or without a trailing slash automatically.
`;
