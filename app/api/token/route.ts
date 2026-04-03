
import { NextRequest, NextResponse } from 'next/server';
import { createToken, getTokenConfig, updateToken } from '@/lib/tokens';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || !token.startsWith('Tk-')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const config = getTokenConfig(token);
  if (!config) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  return NextResponse.json({ config });
}

export async function POST(request: NextRequest) {
  try {
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
