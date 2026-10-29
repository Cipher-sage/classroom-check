import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Test the real callback with isolated auth/GitHub boundaries. No network or live credentials.
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const core = {};
vm.runInNewContext(compile('../app/auth-core.ts'), { exports: core, TextEncoder, TextDecoder });
const callback = compile('../app/api/auth/callback/route.ts');
const config = {
  origin: 'https://exam.example', clientId: 'FAKE_CLIENT_ID', clientSecret: 'FAKE_CLIENT_SECRET',
  adminGithubId: '180553969', sessionSecret: 'FAKE_SESSION_SECRET_at_least_32_characters', secure: true
};
const fake = {
  code: 'PRIVATE_AUTH_CODE', state: 'PRIVATE_STATE', cookie: 'PRIVATE_BROWSER_COOKIE',
  verifier: 'PRIVATE_PKCE_VERIFIER', accessToken: 'PRIVATE_ACCESS_TOKEN', session: 'PRIVATE_SIGNED_SESSION'
};
const secretValues = [...Object.values(fake), config.clientId, config.clientSecret, config.sessionSecret];
const now = 1_800_000_000_000;
const json = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const token = () => json({ access_token: fake.accessToken, token_type: 'bearer' });
const owner = () => json({ id: Number(config.adminGithubId), login: 'unused-profile-name' });
const sensitiveError = () => new Error(secretValues.join(' '));
let cases = 0;

async function run(options = {}) {
  const calls = { config: 0, state: [], fetch: [], sign: [], logs: [] };
  const responses = options.responses ?? [token(), owner()];
  const exports = {};
  const requireMock = name => {
    if (name === '../../../auth') return {
      getAuthConfig() {
        calls.config++;
        if (options.configError) throw sensitiveError();
        return config;
      }
    };
    if (name === '../../../auth-core') return {
      cookie: core.cookie, SESSION_MS: core.SESSION_MS,
      async oauthState(...args) {
        calls.state.push(args);
        if (options.stateError) throw sensitiveError();
        return options.invalidState ? null : { verifier: fake.verifier };
      },
      async sign(payload, secret) {
        calls.sign.push({ payload: JSON.parse(JSON.stringify(payload)), secret });
        if (options.signError) throw sensitiveError();
        return fake.session;
      }
    };
    throw new Error(`Unexpected import ${name}`);
  };
  const capture = (...args) => calls.logs.push(args);
  vm.runInNewContext(callback, {
    exports, require: requireMock, Headers, Response, URL, URLSearchParams, AbortSignal,
    Date: { now: () => now },
    console: Object.fromEntries(['warn', 'error', 'log', 'info', 'debug'].map(method => [method, capture])),
    async fetch(url, init) {
      const index = calls.fetch.length;
      calls.fetch.push({ url, init });
      assert.ok(index < responses.length, 'unexpected outbound request');
      const response = responses[index];
      if (response instanceof Error) throw response;
      return response;
    }
  });
  const url = new URL('/api/auth/callback', options.origin ?? config.origin);
  if (!options.noCode) url.searchParams.set('code', options.longCode ? 'x'.repeat(513) : fake.code);
  url.searchParams.set('state', fake.state);
  if (options.authorizationError) url.searchParams.set('error', secretValues.join(' '));
  const response = await exports.GET(new Request(url, { headers: { Cookie: fake.cookie } }));
  const body = await response.text();
  const logs = JSON.stringify(calls.logs);
  for (const value of secretValues) {
    assert.ok(!logs.includes(value), 'diagnostics must never contain credentials or callback values');
    assert.ok(!body.includes(value), 'response body must never contain credentials or callback values');
  }
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  cases++;
  return { calls, response, body };
}

async function denied(options, stage, detail = '', expectedFetches = 0, expectedSigns = 0) {
  const result = await run(options);
  const { calls, response, body } = result;
  assert.equal(response.status, 403);
  assert.match(body, /Sign-in not completed/);
  assert.equal(response.headers.get('Location'), null);
  assert.equal(calls.fetch.length, expectedFetches, 'reject before crossing subsequent network boundaries');
  assert.equal(calls.sign.length, expectedSigns, 'rejected identities must never receive a session');
  assert.deepEqual(calls.logs, [['admin_oauth_failed', stage, detail]]);
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.some(value => value.startsWith('__Host-cat-admin=')), false);
  if (options.configError) assert.equal(cookies.length, 0);
  else assert.deepEqual(cookies, ['__Host-cat-oauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure']);
  return result;
}

await denied({ configError: true }, 'configuration', 'exception');
const wrongOrigin = await denied({ origin: 'https://attacker.example' }, 'origin');
assert.equal(wrongOrigin.calls.state.length, 0);
await denied({ invalidState: true }, 'state_validation');
await denied({ stateError: true }, 'configuration', 'exception');
for (const options of [{ noCode: true }, { longCode: true }, { authorizationError: true }]) {
  await denied(options, 'authorization_response');
}

await denied({ responses: [new Response('sensitive response ignored', { status: 401 })] }, 'token_fetch', 401, 1);
for (const status of [301, 302, 303, 307, 308]) {
  await denied({ responses: [new Response(null, { status, headers: { Location: 'https://attacker.example/token' } })] }, 'token_fetch', status, 1);
}
await denied({ responses: [sensitiveError()] }, 'token_fetch', 'exception', 1);
await denied({ responses: [new Response('not JSON: ' + fake.accessToken)] }, 'token_payload', 'exception', 1);
for (const error of ['incorrect_client_credentials', 'redirect_uri_mismatch', 'bad_verification_code', 'unverified_user_email', 'incorrect_code_verifier']) {
  await denied({ responses: [json({ error, error_description: secretValues.join(' ') })] }, 'token_payload', error, 1);
}
for (const payload of [
  { error: secretValues.join(' ') },
  {},
  { access_token: 123, token_type: 'bearer' },
  { access_token: fake.accessToken, token_type: 'unexpected-type' }
]) {
  await denied({ responses: [json(payload)] }, 'token_payload', 'invalid_token_response', 1);
}

await denied({ responses: [token(), new Response('ignored', { status: 403 })] }, 'user_fetch', 403, 2);
for (const status of [301, 302, 303, 307, 308]) {
  await denied({ responses: [token(), new Response(null, { status, headers: { Location: 'https://attacker.example/user' } })] }, 'user_fetch', status, 2);
}
await denied({ responses: [token(), sensitiveError()] }, 'user_fetch', 'exception', 2);
await denied({ responses: [token(), new Response('not JSON: ' + fake.accessToken)] }, 'user_payload', 'exception', 2);
for (const id of [undefined, null, Number(config.adminGithubId) + 1, config.adminGithubId, 1.5, 9_007_199_254_740_992]) {
  await denied({ responses: [token(), json({ id })] }, 'user_allowlist', '', 2);
}
await denied({ signError: true }, 'session_sign', 'exception', 2, 1);

const success = await run();
assert.equal(success.response.status, 303);
assert.equal(success.response.headers.get('Location'), `${config.origin}/admin`);
assert.equal(success.body, '');
assert.deepEqual(success.calls.logs, []);
assert.deepEqual(success.calls.state, [[fake.cookie, fake.state, config]], 'validate browser-bound state before token exchange');
assert.equal(success.calls.fetch.length, 2);
const [exchange, identity] = success.calls.fetch;
assert.equal(exchange.url, 'https://github.com/login/oauth/access_token');
assert.equal(exchange.init.method, 'POST');
assert.equal(exchange.init.headers.Accept, 'application/json');
assert.equal(exchange.init.headers['Content-Type'], 'application/x-www-form-urlencoded');
assert.deepEqual(Object.fromEntries(exchange.init.body), {
  client_id: config.clientId, client_secret: config.clientSecret, code: fake.code,
  redirect_uri: `${config.origin}/api/auth/callback`, code_verifier: fake.verifier
});
assert.equal(identity.url, 'https://api.github.com/user');
assert.equal(identity.init.headers.Authorization, `Bearer ${fake.accessToken}`);
for (const call of success.calls.fetch) {
  assert.equal(call.init.redirect, 'manual', 'Workers must return redirects without forwarding credentials; the route rejects non-OK responses');
  assert.ok(call.init.signal instanceof AbortSignal, 'GitHub requests must be time-bounded');
}
assert.deepEqual(success.calls.sign, [{
  payload: { kind: 'session', githubId: config.adminGithubId, iat: now, exp: now + core.SESSION_MS },
  secret: config.sessionSecret
}]);
assert.deepEqual(success.response.headers.getSetCookie(), [
  '__Host-cat-oauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure',
  `__Host-cat-admin=${fake.session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600; Secure`
]);
assert.ok(!JSON.stringify([...success.response.headers]).includes(fake.accessToken), 'GitHub token must never reach the browser');
console.log(`PASS: ${cases} OAuth callback cases deny invalid state, token exchange, identity and signing; owner login gets secure cookies; diagnostics expose no credentials.`);
