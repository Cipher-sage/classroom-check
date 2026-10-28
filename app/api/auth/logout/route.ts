import { getAuthConfig } from '../../../auth';
import { cookie, validMutationOrigin } from '../../../auth-core';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const config = getAuthConfig();
    if (!validMutationOrigin(req, config)) return new Response('Invalid origin.', { status: 403, headers: { 'Cache-Control': 'no-store' } });
    const headers = new Headers({ Location: `${config.origin}/admin`, 'Cache-Control': 'no-store' });
    headers.append('Set-Cookie', cookie(config, 'session', '', 0));
    headers.append('Set-Cookie', cookie(config, 'oauth', '', 0));
    return new Response(null, { status: 303, headers });
  } catch {
    return new Response('Sign-out is unavailable. Please close this page.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
