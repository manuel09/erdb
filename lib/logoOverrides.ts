// TMDB does not expose per-season logos: the whole Pokemon saga lives on a
// single series (60572) whose gallery mixes one logo per era, so the plain
// language pick serves the same logo for every entry. Pin each Kitsu entry to
// its saga logo (paths are TMDB logo files of that series).
export const KITSU_LOGO_OVERRIDES: Record<string, string> = {
  '486': '/xvERvRImZQOj83WPj1y3nxPxMDv.png', // Pokemon (serie originale, generico)
  '1404': '/6oSwfYif5lOVYSjcsZwaPFXLurV.png', // Advanced
  '1405': '/qZt5iJNdpZ5q9m7qXWhswWtEj9W.png', // Diamond and Pearl
  '5605': '/niRldWMRMBZsYbYkWsPkKRAhSfa.png', // Black & White
  '7080': '/8btj05xyLekFr0n4Sm0qVypHlMp.png', // BW Rival Destinies
  '7586': '/gJ0W3n0DLbLyDrTXD9XOAT5fYoq.png', // BW Adventures in Unova
  '7895': '/gJ0W3n0DLbLyDrTXD9XOAT5fYoq.png', // Decolora: nessun logo "and Beyond", uso Unova
  '7850': '/8FjMFv8Sd46UfcUJW4Q1xPBSJUc.png', // XY
  '11367': '/29yKDJEY93BxDMRKSR1BbF4A3BO.png', // XY&Z
  '12533': '/fqhGIRbQHm57Ma0X8Tkw6BzOJA7.png', // Sun & Moon
  '42534': '/1FYfDNrEHQWbNbjX7Px7C5EM1Gy.png', // Journeys
  '46857': '/5O7byjPlp0RVp3aWdOMQH8Q7S8w.png', // Mezase: nessun logo dedicato, uso Ultimate Journeys (S25)
};

export const getKitsuLogoOverride = (kitsuId?: string | null): string | null => {
  const normalized = String(kitsuId || '').trim();
  if (!normalized) return null;
  return KITSU_LOGO_OVERRIDES[normalized] || null;
};
