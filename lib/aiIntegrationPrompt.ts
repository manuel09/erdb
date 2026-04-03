export const ERDB_AI_INTEGRATION_PROMPT = `Act as an expert media center addon developer. I want to implement ERDB into my addon to provide enhanced posters, backdrops, logos, and thumbnails with rating badges and stream quality overlays.

### --- CONFIG INPUT ---
Add a single text configuration field called "erdbToken".
The user will paste their ERDB token from the configurator after logging in.

Use this fixed ERDB base URL:
https://easyratingsdb.com

Do NOT ask for TMDB keys, MDBList keys, layout fields, rating provider lists, or a custom base URL inside the addon UI.
Those settings are already stored server-side behind the token.

### --- API MODEL ---
ERDB is now token-based for renderer URLs.

**Renderer endpoint:**
GET https://easyratingsdb.com/{erdbToken}/{type}/{id}.jpg

Path parameter | Values
--- | ---
erdbToken | Tk-...
type | poster, backdrop, logo, thumbnail
id | IMDb (tt...), TMDB (tmdb:id, tmdb:movie:id, tmdb:tv:id), TVDB episode IDs, Kitsu, AniList, MAL

All visual settings, provider choices, API keys, language defaults, layouts, and badge options are resolved from the token on the server.

### --- COMMON URL PATTERNS ---
Use these patterns directly if you are not generating the integration from the ERDB workspace UI:

Pattern | Use case
--- | ---
https://easyratingsdb.com/{erdbToken}/poster/{imdbId}.jpg | Movie or series poster
https://easyratingsdb.com/{erdbToken}/backdrop/{imdbId}.jpg | Movie or series backdrop
https://easyratingsdb.com/{erdbToken}/logo/{imdbId}.jpg | Movie or series logo
https://easyratingsdb.com/{erdbToken}/thumbnail/{seriesImdbId}:{season}:{episode}.jpg | Episode thumbnail with IMDb episode addressing
https://easyratingsdb.com/{erdbToken}/thumbnail/realimdb:{seriesImdbId}:{season}:{episode}.jpg | Episode thumbnail when the addon uses real IMDb TV metadata
https://easyratingsdb.com/{erdbToken}/thumbnail/tvdb:{tvdbId}:{season}:{episode}.jpg | Episode thumbnail when the addon uses TVDB numbering
https://easyratingsdb.com/{erdbToken}/poster/tmdb:movie:{tmdbId}.jpg | Movie poster when only TMDB movie ID is available
https://easyratingsdb.com/{erdbToken}/backdrop/tmdb:tv:{tmdbId}.jpg | Series backdrop when only TMDB TV ID is available

### --- INTEGRATION REQUIREMENTS ---
1. Minimal UI: Use only \`erdbToken\`.
2. Artwork Toggles: Provide optional toggles to enable or disable ERDB for posters, backdrops, logos, and thumbnails.
3. Smart Fallback: If ERDB is disabled for a type, or if the token is missing, keep the original artwork URL.
4. URL Building: Always use \`https://easyratingsdb.com\` as the base URL and append token, type, and media id.
5. Preserve Existing IDs: Do not rewrite IDs unless your addon already has a normalization layer.

### --- URL BUILD LOGIC ---
function buildErdbUrl({ erdbToken, type, id }) {
  if (!erdbToken || !type || !id) {
    return null;
  }

  return \`https://easyratingsdb.com/\${erdbToken}/\${type}/\${id}.jpg\`;
}

### --- EXAMPLES ---
Movie poster:
\`\`\`
https://easyratingsdb.com/Tk-abc123/poster/tt0133093.jpg
\`\`\`

Series backdrop:
\`\`\`
https://easyratingsdb.com/Tk-abc123/backdrop/tt0944947.jpg
\`\`\`

Episode thumbnail:
\`\`\`
https://easyratingsdb.com/Tk-abc123/thumbnail/tt0944947:1:1.jpg
\`\`\`

If the addon uses real IMDb TV metadata for episodes and thumbnails, use the \`realimdb:\` prefix for the episode id.
Example:
\`\`\`
https://easyratingsdb.com/Tk-abc123/thumbnail/realimdb:tt0944947:1:1.jpg
\`\`\`

### --- PROXY NOTE ---
If you also integrate the ERDB proxy manifest, keep that as a separate feature.
For artwork rendering, the addon should not append TMDB, MDBList, SIMKL, style, or layout query parameters when a token is available.
`;
