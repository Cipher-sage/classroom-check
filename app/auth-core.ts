// Platform-independent security primitives, shared by the Worker and focused tests.
export const SESSION_MS = 60 * 60 * 1000;
export const OAUTH_MS = 10 * 60 * 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type AuthConfig = {
  origin: string;
  clientId: string;
  clientSecret: string;
  adminGithubId: string;
  sessionSecret: string;
  secure: boolean;
};

export function authConfig(values: Record<string, unknown>): AuthConfig {
  const read = (name: string) => typeof values[name] === 'string' ? (values[name] as string).trim() : '';
  const origin = read('APP_ORIGIN');
  const url = new URL(origin);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.origin !== origin || url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))) throw new Error('Invalid auth configuration.');
  const clientId = read('GITHUB_CLIENT_ID');
  const clientSecret = read('GITHUB_CLIENT_SECRET');
  const adminGithubId = read('ADMIN_GITHUB_ID');
  const sessionSecret = read('SESSION_SECRET');
  if (!clientId || !clientSecret || !/^[1-9][0-9]*$/.test(adminGithubId) || sessionSecret.length < 32) throw new Error('Incomplete auth configuration.');
  return { origin, clientId, clientSecret, adminGithubId, sessionSecret, secure: url.protocol === 'https:' };
}

export function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding.');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
}

async function signingKey(secret: string) {
  if (secret.length < 32) throw new Error('Invalid signing key.');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function sign(payload: Record<string, unknown>, secret: string): Promise<string> {
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(body)));
  return `${body}.${base64url(signature)}`;
}

export async function verify(token: string | null, secret: string, kind: 'session' | 'oauth', now = Date.now()): Promise<Record<string, unknown> | null> {
  try {
    if (!token || token.length > 4096) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const signature = fromBase64url(parts[1]);
    if (signature.length !== 32 || !await crypto.subtle.verify('HMAC', await signingKey(secret), signature, encoder.encode(parts[0]))) return null;
    const payload = JSON.parse(decoder.decode(fromBase64url(parts[0])));
    if (!payload || payload.kind !== kind || !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp)) return null;
    const maxAge = kind === 'session' ? SESSION_MS : OAUTH_MS;
    if (payload.iat > now + 30_000 || payload.exp <= now || payload.exp <= payload.iat || payload.exp - payload.iat > maxAge) return null;
    return payload;
  } catch { return null; }
}

export function randomToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
}

export function cookieName(config: AuthConfig, kind: 'session' | 'oauth'): string {
  return `${config.secure ? '__Host-' : ''}cat-${kind === 'session' ? 'admin' : 'oauth'}`;
}

export function readCookie(header: string | null, name: string): string | null {
  const found = (header ?? '').split(';').map(x => x.trim()).filter(x => x.startsWith(`${name}=`));
  return found.length === 1 ? found[0].slice(name.length + 1) : null;
}

export function cookie(config: AuthConfig, kind: 'session' | 'oauth', value: string, ageSeconds: number): string {
  return `${cookieName(config, kind)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ageSeconds}${config.secure ? '; Secure' : ''}`;
}

export function validMutationOrigin(req: Request, config: AuthConfig): boolean {
  return req.headers.get('Origin') === config.origin && new URL(req.url).origin === config.origin && req.headers.get('Sec-Fetch-Site') !== 'cross-site';
}

export async function sessionUser(cookieHeader: string | null, config: AuthConfig, now = Date.now()) {
  const payload = await verify(readCookie(cookieHeader, cookieName(config, 'session')), config.sessionSecret, 'session', now);
  if (payload?.githubId !== config.adminGithubId) return null;
  return { userId: `github:${config.adminGithubId}`, githubId: config.adminGithubId, displayName: 'Administrator', expiresAt: payload.exp as number };
}

export async function oauthState(cookieHeader: string | null, state: string | null, config: AuthConfig, now = Date.now()) {
  const payload = await verify(readCookie(cookieHeader, cookieName(config, 'oauth')), config.sessionSecret, 'oauth', now);
  if (!state || state.length !== 43 || payload?.state !== state || typeof payload.verifier !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(payload.verifier)) return null;
  return { verifier: payload.verifier };
}
