import { getAuthConfig } from '../../../auth';
import { cookie, OAUTH_MS, pkceChallenge, randomToken, sign } from '../../../auth-core';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const config = getAuthConfig();
    if (new URL(req.url).origin !== config.origin) return new Response('Use the configured site address to sign in.', { status: 400 });
    const state = randomToken(), verifier = randomToken(), now = Date.now();
    const token = await sign({ kind: 'oauth', state, verifier, iat: now, exp: now + OAUTH_MS }, config.sessionSecret);
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: `${config.origin}/api/auth/callback`, scope: '', state, code_challenge: await pkceChallenge(verifier), code_challenge_method: 'S256', allow_signup: 'false', prompt: 'select_account' }).toString();
    return new Response(null, { status: 302, headers: { Location: url.href, 'Set-Cookie': cookie(config, 'oauth', token, OAUTH_MS / 1000), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch {
    return new Response('Administrator sign-in is not configured yet. Please contact the site owner.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
