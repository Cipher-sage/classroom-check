import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import ts from 'typescript';
import * as orm from 'drizzle-orm';
import * as sqliteCore from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/d1';

// The public "request access" form and the admin list of requests, against real SQLite and the real route.
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const schema = {};
vm.runInNewContext(compile('../db/schema.ts'), { exports: schema, require: () => sqliteCore });
const sqlite = new DatabaseSync(':memory:');
for (const f of ['0000_broken_outlaw_kid', '0001_needy_sheva_callister', '0002_big_stature']) sqlite.exec(readFileSync(new URL(`../drizzle/${f}.sql`, import.meta.url), 'utf8'));
const binding = { prepare(sql) { return { bind(...params) {
  const execute = method => { const st = sqlite.prepare(sql); if (method === 'run') return { success: true, meta: st.run(...params) }; if (method === 'raw') st.setReturnArrays(true); const rows = st.all(...params); return method === 'raw' ? rows : { results: rows }; };
  return { run: async () => execute('run'), raw: async () => execute('raw'), all: async () => execute('all') };
} }; } };
const db = drizzle(binding, { schema });
let user = { userId: 'github:owner' }, allowed = true;
const route = {}, errors = [];
const requireMock = name => {
  if (name === 'drizzle-orm') return orm;
  if (name === '../../../db/schema') return schema;
  if (name === '../../../db') return { getDb: () => db };
  if (name === '../../auth') return { getAdminUser: async () => user, getAuthConfig: () => ({}) };
  if (name === '../../admin-auth') return { isAdmin: () => allowed };
  if (name === '../../auth-core') return { validMutationOrigin: () => true };
  if (name === '../../roster') return { rosterKey: x => String(x).toUpperCase().replace(/[^A-Z0-9]/g, '') };
  throw Error(`Unexpected import ${name}`);
};
vm.runInNewContext(compile('../app/api/test/route.ts'), { exports: route, require: requireMock, Response, URL, crypto: globalThis.crypto, console: { error: (...a) => errors.push(a) } });
const call = async body => { const r = await route.POST(new Request('https://x.example/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://x.example' }, body: JSON.stringify(body) })); return { status: r.status, body: await r.json() }; };
const rows = () => sqlite.prepare('SELECT * FROM access_requests ORDER BY created').all();
const good = { action: 'requestaccess', name: 'Dr Ada Obi', institution: 'Example University', email: 'Ada@Example.edu.ng', website: '' };

// anyone can ask, with no sign-in
user = null; allowed = false;
let r = await call(good);
assert.equal(r.status, 200); assert.equal(r.body.ok, true);
assert.equal(rows().length, 1);
assert.equal(rows()[0].email, 'ada@example.edu.ng', 'emails are stored in lower case');
// the same email again changes nothing and leaks nothing
r = await call({ ...good, name: 'Someone Else' });
assert.equal(r.status, 200); assert.equal(rows().length, 1); assert.equal(rows()[0].name, 'Dr Ada Obi');
// bad input is refused
for (const bad of [{ ...good, name: '' }, { ...good, institution: ' ' }, { ...good, email: 'not-an-email' }, { ...good, email: 'a@b' }, { ...good, name: 'x'.repeat(101) }, { ...good, email: 'x'.repeat(150) + '@e.com' }, { ...good, name: 42 }, { action: 'requestaccess' }]) {
  r = await call({ ...bad, email: bad.email ?? 'z@z.com' }); assert.equal(r.status, 400, JSON.stringify(bad).slice(0, 60));
}
assert.equal(rows().length, 1);
// bots that fill the hidden field are quietly ignored
r = await call({ ...good, email: 'bot@example.com', website: 'http://spam.example' });
assert.equal(r.status, 200); assert.equal(rows().length, 1);
// script-looking text is stored as plain text and never run by the server
r = await call({ ...good, email: 'x@example.com', name: '<script>alert(1)</script>' }); assert.equal(r.status, 200);
assert.equal(rows().length, 2);
// the table stops growing at 2000
sqlite.exec(`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM n WHERE i<1998) INSERT INTO access_requests SELECT 'id'||i,'N','I','e'||i||'@e.com',1 FROM n`);
assert.equal(rows().length, 2000);
r = await call({ ...good, email: 'late@example.com' }); assert.equal(r.status, 429);
assert.equal(rows().length, 2000);
// only the admin can read the list
r = await call({ action: 'accessrequests' }); assert.equal(r.status, 401, 'signed-out visitors cannot read requests');
user = { userId: 'github:owner' }; allowed = false;
r = await call({ action: 'accessrequests' }); assert.equal(r.status, 403, 'a signed-in non-admin cannot read requests');
allowed = true;
r = await call({ action: 'accessrequests' }); assert.equal(r.status, 200); assert.equal(r.body.requests.length, 500, 'list is capped');
assert.ok(r.body.requests[0].created >= r.body.requests[499].created, 'newest first');
assert.deepEqual(errors, []);
sqlite.close();
console.log('PASS: access requests accepted publicly with validation, de-duplication, bot trap and a 2,000-row cap; readable only by the admin.');
