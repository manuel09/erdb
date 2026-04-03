import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'erdb_workspace_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

const getSessionSecret = () =>
  process.env.WORKSPACE_SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  'erdb-dev-workspace-secret';

const shouldUseSecureCookie = () => process.env.WORKSPACE_SESSION_SECURE === 'true';

const sign = (value: string) =>
  createHmac('sha256', getSessionSecret()).update(value).digest('hex');

export type WorkspaceSession = {
  token: string;
  expiresAt: number;
};

export async function readWorkspaceSession(): Promise<WorkspaceSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  const [encodedPayload, signature] = raw.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = sign(encodedPayload);
  const isValidSignature =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!isValidSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as WorkspaceSession;
    if (!payload?.token || typeof payload.expiresAt !== 'number') {
      return null;
    }
    if (payload.expiresAt <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createWorkspaceSession(token: string) {
  const cookieStore = await cookies();
  const payload: WorkspaceSession = {
    token,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const value = `${encodedPayload}.${sign(encodedPayload)}`;

  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    expires: new Date(payload.expiresAt),
  });
}

export async function clearWorkspaceSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    expires: new Date(0),
  });
}
