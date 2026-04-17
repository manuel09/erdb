
import { NextRequest, NextResponse } from 'next/server';
import { createToken, getTokenConfig, updateToken, verifyPassword } from '@/lib/tokens';
import { readWorkspaceAccess } from '@/lib/workspaceAccess';
import { accountsDb } from '@/lib/accountsDb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const password = searchParams.get('password');

  if (!token || !token.startsWith('Tk-')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 401 });
  }

  const row = accountsDb.prepare('SELECT password_hash FROM tokens WHERE token = ?').get(token) as { password_hash: string } | undefined;
  if (!row) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  if (!verifyPassword(password, row.password_hash)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const config = getTokenConfig(token);
  return NextResponse.json({ config });
}

export async function POST(request: NextRequest) {
  try {
    if (!(await readWorkspaceAccess())) {
      return NextResponse.json({ error: 'Configurator password required' }, { status: 401 });
    }

    const { password, config } = await request.json();

    if (!password || !config) {
      return NextResponse.json({ error: 'Password and config are required' }, { status: 400 });
    }

    const token = createToken(password, config);
    return NextResponse.json({ token, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await readWorkspaceAccess())) {
      return NextResponse.json({ error: 'Configurator password required' }, { status: 401 });
    }

    const { token, password, config } = await request.json();

    if (!token || !password || !config) {
      return NextResponse.json({ error: 'Token, password, and config are required' }, { status: 400 });
    }

    try {
      updateToken(token, password, config);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      const status = error.message === 'Invalid password' ? 401 : 404;
      return NextResponse.json({ error: error.message }, { status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
