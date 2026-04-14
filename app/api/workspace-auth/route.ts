import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, createTokenWithValue, generateRandomToken, deleteToken, getTokenConfig } from '@/lib/tokens';
import {
  clearWorkspaceSession,
  createWorkspaceSession,
  readWorkspaceSession,
} from '@/lib/workspaceSession';
import {
  clearWorkspaceAccess,
  grantWorkspaceAccess,
  isWorkspacePasswordEnabled,
  readWorkspaceAccess,
  verifyWorkspacePassword,
} from '@/lib/workspaceAccess';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action;

    if (action === 'gate-status') {
      return NextResponse.json({
        enabled: isWorkspacePasswordEnabled(),
        unlocked: await readWorkspaceAccess(),
      });
    }

    if (action === 'verify-access') {
      const password = typeof body?.accessPassword === 'string' ? body.accessPassword : '';

      if (!isWorkspacePasswordEnabled()) {
        return NextResponse.json({ success: true, enabled: false, unlocked: true });
      }

      if (!password) {
        return NextResponse.json({ error: 'Configurator password is required' }, { status: 400 });
      }

      if (!verifyWorkspacePassword(password)) {
        return NextResponse.json({ error: 'Invalid configurator password' }, { status: 401 });
      }

      await grantWorkspaceAccess();
      return NextResponse.json({ success: true, enabled: true, unlocked: true });
    }

    const requiresAccess =
      action === 'generate-token' ||
      action === 'register' ||
      action === 'login' ||
      action === 'rotate-token';

    if (requiresAccess && !(await readWorkspaceAccess())) {
      return NextResponse.json({ error: 'Configurator password required' }, { status: 401 });
    }

    if (action === 'generate-token') {
      return NextResponse.json({ success: true, token: generateRandomToken() });
    }

    if (action === 'register') {
      const token = typeof body?.token === 'string' ? body.token.trim() : '';
      const password = typeof body?.password === 'string' ? body.password.trim() : '';
      if (!token || !token.startsWith('Tk-')) {
        return NextResponse.json({ error: 'Generated token is required' }, { status: 400 });
      }
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }

      createTokenWithValue(token, password, {});
      await createWorkspaceSession(token);
      return NextResponse.json({ success: true, token });
    }

    if (action === 'login') {
      const token = typeof body?.token === 'string' ? body.token.trim() : '';
      const password = typeof body?.password === 'string' ? body.password : '';

      if (!token || !password) {
        return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
      }

      const account = authenticateToken(token, password);
      await createWorkspaceSession(account.token);
      return NextResponse.json({ success: true, token: account.token, config: account.config });
    }

    if (action === 'rotate-token') {
      // Must be authenticated via session
      const session = await readWorkspaceSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const oldToken = session.token;
      const password = typeof body?.password === 'string' ? body.password : '';
      if (!password) {
        return NextResponse.json({ error: 'Password is required to rotate the token' }, { status: 400 });
      }

      // Verify old token + fetch config
      const account = authenticateToken(oldToken, password);
      const configData = getTokenConfig(oldToken);
      const config = configData?.config ?? account.config ?? {};

      // Create new token with same password and migrated config
      const newToken = generateRandomToken();
      createTokenWithValue(newToken, password, config);

      // Switch session to new token
      await createWorkspaceSession(newToken);

      // Delete old token
      deleteToken(oldToken, password);

      return NextResponse.json({ success: true, newToken, oldToken });
    }

    if (action === 'logout') {
      await clearWorkspaceSession();
      await clearWorkspaceAccess();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    const status =
      error?.message === 'Invalid password' ? 401 : error?.message === 'Token not found' ? 404 : 500;
    return NextResponse.json({ error: error?.message || 'Authentication failed' }, { status });
  }
}
