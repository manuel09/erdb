import { NextRequest, NextResponse } from 'next/server';
import { buildProxyCatalogDescriptors } from '@/lib/proxyCatalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isSafeUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();

    // Block localhost and internal IPs
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host === '0.0.0.0'
    ) {
      return false;
    }

    // Block cloud metadata services (Amazon, Google, Azure, etc.)
    if (host === '169.254.169.254' || host === 'metadata.google.internal') {
      return false;
    }

    // Block private IP ranges (192.168.x.x, 10.x.x.x, 172.16.x.x to 172.31.x.x)
    const privateIpRegex = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/;
    if (privateIpRegex.test(host)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const parseManifestUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const url = new URL(trimmed);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  if (!isSafeUrl(url.toString())) {
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
