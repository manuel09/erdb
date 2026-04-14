import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'erdb_workspace_access';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

const getSessionSecret = () =>
  process.env.WORKSPACE_SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  'erdb-dev-workspace-secret';

const shouldUseSecureCookie = () => process.env.WORKSPACE_SESSION_SECURE === 'true';

const sign = (value: string) =>
  createHmac('sha256', getSessionSecret()).update(value).digest('hex');

const safeEqual = (left: string, right: string) =>
  left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right));

export function getRequiredWorkspacePassword() {
  const password = process.env.ERDB_CONFIGURATOR_PASSWORD;
  return typeof password === 'string' && password.length > 0 ? password : '';
}

export function isWorkspacePasswordEnabled() {
  return getRequiredWorkspacePassword().length > 0;
}

export function verifyWorkspacePassword(password: string) {
  const expected = getRequiredWorkspacePassword();
  if (!expected) {
    return true;
  }

  return safeEqual(password, expected);
}

export async function readWorkspaceAccess(): Promise<boolean> {
  if (!isWorkspacePasswordEnabled()) {
    return true;
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) {
    return false;
  }

  const [encodedPayload, signature] = raw.split('.');
  if (!encodedPayload || !signature) {
    return false;
  }

  const expected = sign(encodedPayload);
  if (!safeEqual(signature, expected)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as { expiresAt?: number };
    return typeof payload.expiresAt === 'number' && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function grantWorkspaceAccess() {
  const cookieStore = await cookies();
  const payload = { expiresAt: Date.now() + SESSION_DURATION_MS };
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

export async function clearWorkspaceAccess() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    expires: new Date(0),
  });
}
