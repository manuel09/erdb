export const ERDB_AI_INTEGRATION_PROMPT = `Act as an expert media center addon developer. I want to implement the ERDB Stateless API into my addon to provide enhanced posters, backdrops, logos, and thumbnails with rating badges and stream quality overlays.

### --- CONFIG INPUT ---
Add a single text configuration field called "erdbConfig" (base64url encoded JSON). The user will paste this string from the ERDB Configurator site after they have configured their desired layout and API keys.

Do NOT hardcode API keys or a static base URL. Instead, always use the fields decoded from the erdbConfig string.

### --- DECODE ---
The erdbConfig string is a base64url-encoded JSON object.
**Node.js / JS Example:**
const json = Buffer.from(erdbConfig, 'base64url').toString('utf8');
const cfg = JSON.parse(json);
// Use cfg.erdbBase (or cfg.baseUrl), cfg.tmdbKey, cfg.mdblistKey, etc.

### --- FULL API REFERENCE ---
**Endpoint:** GET {erdbBase}/{type}/{id}.jpg?queryParams

Parameter | Values | Default
--- | --- | ---
type (path) | poster, backdrop, logo, thumbnail | -
id (path) | IMDb (tt...), TMDB (tmdb:id, tmdb:movie:id, tmdb:tv:id), Kitsu (kitsu:id), AniList, MAL | -
tmdbKey | Required. (from cfg.tmdbKey) | -
mdblistKey | Required. (from cfg.mdblistKey) | -
simklClientId | Optional. (from cfg.simklClientId) | -
ratings | Global providers list. (tmdb, imdb, mdblist, tomatoes, trakt, simkl, etc.) | all
posterRatings | Providers for posters only. | cfg.ratings
backdropRatings | Providers for backdrops only. | cfg.ratings
thumbnailRatings| Providers for thumbnails only. (Supports tmdb, imdb only) | cfg.ratings
logoRatings | Providers for logos only. | cfg.ratings
lang | TMDB language code (e.g. en, it, es-ES) | en
ratingStyle | glass, square, plain | glass
imageText | original (default), clean, alternative | original
streamBadges | auto, on, off | auto
posterRatingsLayout| top, bottom, left, right, top-bottom, left-right | top-bottom
thumbnailSize | small, medium, large | medium
logoFontVariant | spicy-sale, somelist, rubik-spray-paint, nabla, honk, paper-scratch, sludgeborn, playgum, atlasmemo, dracutaz, banana-chips, holy-star, rocks-serif | spicy-sale
logoPrimary | Custom logo primary color (HEX without #) | -

Note: For a full list of parameters (layouts, offsets, colors, fonts), refer to the ERDB Configurator's advanced export.

### --- INTEGRATION REQUIREMENTS ---
1. No Extra UI: Use ONLY the erdbConfig field. Do not create separate "TMDB Key" or "Ratings" settings panels.
2. Artwork Toggles: Provide user toggles to enable/disable ERDB for each type (Posters, Backdrops, Logos, Thumbnails).
3. Smart Fallback: If a type is disabled, or if the user hasn't provided a config, use the original metadata URL.
4. URL Building: 
   - Extract type-specific settings from cfg (e.g., cfg.posterRatingStyle).
   - Append all relevant fields from the cfg object as query parameters.
   - Omit imageText when requesting type=logo or type=thumbnail.
   - Append .jpg to the {id} in the path.

### --- URL BUILD LOGIC ---
const typeRatingStyle = type === 'poster' ? cfg.posterRatingStyle : type === 'backdrop' ? cfg.backdropRatingStyle : cfg.logoRatingStyle;
const typeImageText = type === 'backdrop' ? cfg.backdropImageText : cfg.posterImageText;

const url = new URL(\`\${cfg.erdbBase}/\${type}/\${id}.jpg\`);
url.searchParams.set('tmdbKey', cfg.tmdbKey);
url.searchParams.set('mdblistKey', cfg.mdblistKey);
if (cfg.simklClientId) url.searchParams.set('simklClientId', cfg.simklClientId);
if (cfg.lang) url.searchParams.set('lang', cfg.lang);

if (typeRatingStyle) url.searchParams.set('ratingStyle', typeRatingStyle);
if (type !== 'logo' && type !== 'thumbnail' && typeImageText) url.searchParams.set('imageText', typeImageText);

const providers = cfg[\`\${type}Ratings\`] || cfg.ratings;
if (providers) url.searchParams.set(type === 'thumbnail' ? 'ratings' : \`\${type}Ratings\`, providers);

Object.keys(cfg).forEach(key => {
  if (!['erdbBase', 'baseUrl', 'tmdbKey', 'mdblistKey', 'simklClientId', 'lang'].includes(key)) {
    url.searchParams.set(key, cfg[key]);
  }
});

return url.toString();`;
