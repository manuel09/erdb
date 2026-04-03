import { NextRequest, NextResponse } from 'next/server';
import { getTokenConfig, updateTokenConfigWithoutPassword } from '@/lib/tokens';
import { readWorkspaceSession } from '@/lib/workspaceSession';

export async function GET() {
  const session = await readWorkspaceSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokenConfig = getTokenConfig(session.token);
  if (!tokenConfig) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  return NextResponse.json({ token: session.token, config: tokenConfig.config });
}

export async function PUT(request: NextRequest) {
  const session = await readWorkspaceSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { config } = await request.json();
    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 });
    }

    updateTokenConfigWithoutPassword(session.token, config);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to sync config' }, { status: 500 });
  }
}
