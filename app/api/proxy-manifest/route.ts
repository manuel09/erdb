import { NextRequest, NextResponse } from 'next/server';
import { buildProxyCatalogDescriptors } from '@/lib/proxyCatalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const parseManifestUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const url = new URL(trimmed);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  return url.toString();
};

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing "url" query parameter.' }, { status: 400 });
  }

  let manifestUrl: string | null = null;
  try {
    manifestUrl = parseManifestUrl(rawUrl);
  } catch {
    manifestUrl = null;
  }

  if (!manifestUrl) {
    return NextResponse.json({ error: 'Invalid manifest URL.' }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(manifestUrl, { cache: 'no-store' });
  } catch {
    return NextResponse.json({ error: 'Unable to reach the source manifest.' }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `Source manifest returned ${response.status}.` },
      { status: 502 }
    );
  }

  let manifest: Record<string, unknown>;
  try {
    manifest = (await response.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Source manifest is not valid JSON.' }, { status: 502 });
  }

  return NextResponse.json({
    catalogs: buildProxyCatalogDescriptors(manifest.catalogs),
  });
}
