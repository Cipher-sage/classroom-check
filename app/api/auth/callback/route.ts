import { getAuthConfig } from '../../../auth';
import { cookie, oauthState, SESSION_MS, sign, type AuthConfig } from '../../../auth-core';
export const dynamic = 'force-dynamic';

function failed(config?: AuthConfig, stage = 'unknown', detail?: string | number) {
  // Fixed diagnostic labels only: never log URLs, cookies, codes, tokens or secrets.
  console.warn('admin_oauth_failed', stage, detail ?? '');
  const headers = new Headers({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Content-Type': 'text/html; charset=utf-8' });
  if (config) headers.append('Set-Cookie', cookie(config, 'oauth', '', 0));
  return new Response('<!doctype html><title>Sign-in not completed</title><h1>Sign-in not completed</h1><p>Use the authorized administrator GitHub account, or try signing in again.</p><a href="/admin">Return to admin sign in</a>', { status: 403, headers });
}

export async function GET(req: Request) {
  let config: AuthConfig | undefined;
  let stage = 'configuration';
  try {
    config = getAuthConfig();
    const url = new URL(req.url);
    if (url.origin !== config.origin) return failed(config, 'origin');
    const code = url.searchParams.get('code');
    const oauth = await oauthState(req.headers.get('cookie'), url.searchParams.get('state'), config);
    if (!oauth) return failed(config, 'state_validation');
    if (!code || code.length > 512 || url.searchParams.has('error')) return failed(config, 'authorization_response');
    stage = 'token_fetch';
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: `${config.origin}/api/auth/callback`, code_verifier: oauth.verifier }),
      signal: AbortSignal.timeout(10_000), redirect: 'manual'
    });
    if (!tokenResponse.ok) return failed(config, stage, tokenResponse.status);
    stage = 'token_payload';
    const token = await tokenResponse.json() as { access_token?: unknown; token_type?: unknown; error?: unknown };
    if (typeof token.access_token !== 'string' || token.token_type !== 'bearer') {
      const knownErrors = ['incorrect_client_credentials', 'redirect_uri_mismatch', 'bad_verification_code', 'unverified_user_email', 'incorrect_code_verifier'];
      return failed(config, stage, typeof token.error === 'string' && knownErrors.includes(token.error) ? token.error : 'invalid_token_response');
    }
    stage = 'user_fetch';
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'CAT-500-Level-Test', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(10_000), redirect: 'manual'
    });
    if (!userResponse.ok) return failed(config, stage, userResponse.status);
    stage = 'user_payload';
    const user = await userResponse.json() as { id?: unknown };
    if (!Number.isSafeInteger(user.id) || String(user.id) !== config.adminGithubId) return failed(config, 'user_allowlist');
    stage = 'session_sign';
    const now = Date.now();
    const session = await sign({ kind: 'session', githubId: config.adminGithubId, iat: now, exp: now + SESSION_MS }, config.sessionSecret);
    // The GitHub token is used only for this identity check, never stored or sent to the browser.
    const headers = new Headers({ Location: `${config.origin}/admin`, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    headers.append('Set-Cookie', cookie(config, 'oauth', '', 0));
    headers.append('Set-Cookie', cookie(config, 'session', session, SESSION_MS / 1000));
    return new Response(null, { status: 303, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const detail = /redirect/i.test(message) ? 'redirect_error' : /timeout|timed out/i.test(message) ? 'timeout_error' : /abort/i.test(message) ? 'abort_error' : /not (implemented|supported)/i.test(message) ? 'unsupported_error' : /fetch failed|network|dns|resolve/i.test(message) ? 'network_error' : 'exception';
    return failed(config, stage, detail);
  }
}
