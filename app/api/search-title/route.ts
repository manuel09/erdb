import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type TmdbSearchResult = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  poster_path?: string | null;
  overview?: string;
};

type TmdbExternalIds = {
  imdb_id?: string | null;
};

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get('q')?.trim();
  const tmdbKey = searchParams.get('tmdbKey')?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }
  if (!tmdbKey) {
    return NextResponse.json({ error: 'Missing tmdbKey' }, { status: 400 });
  }

  const searchUrl = `${TMDB_BASE}/search/multi?api_key=${encodeURIComponent(tmdbKey)}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
  const searchData = await fetchJson<{ results?: TmdbSearchResult[] }>(searchUrl);

  if (!searchData?.results) {
    return NextResponse.json({ results: [] });
  }

  // Filter to movies and TV only, take top 6
  const candidates = searchData.results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 6);

  // Fetch IMDB IDs in parallel
  const results = await Promise.all(
    candidates.map(async (item) => {
      const extUrl = `${TMDB_BASE}/${item.media_type}/${item.id}/external_ids?api_key=${encodeURIComponent(tmdbKey)}`;
      const ext = await fetchJson<TmdbExternalIds>(extUrl);
      const imdbId = ext?.imdb_id ?? null;
      const title = item.title ?? item.name ?? '';
      const year = (item.release_date ?? item.first_air_date ?? '').slice(0, 4);
      return {
        tmdbId: item.id,
        imdbId,
        title,
        year,
        type: item.media_type as 'movie' | 'tv',
        poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
      };
    })
  );

  return NextResponse.json({ results });
}
