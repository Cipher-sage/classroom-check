import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the endpoint itself with owner-aware database/auth boundaries; never touch live records.
async function testRoute(file, identityImport, identityName) {
  let user = null, allowed = false, reads = 0;
  const exams = { table: 'exams', id: 'exams.id', owner: 'exams.owner' }, attempts = { table: 'attempts', exam: 'attempts.exam' };
  const data = { exams: [{ id: 'owner-exam', owner: 'owner-id', questions: 'private-key' }], attempts: [{ id: 'attempt-id', exam: 'owner-exam', answers: 'private-answers', score: 1 }] };
  const db = {
    select: fields => ({ from: table => ({ where: predicate => ({ fields, table, predicate }) }) }),
    batch: async queries => {
      reads++;
      assert.equal(queries.length, 2, 'both reads share one batch');
      assert.deepEqual(queries[0].predicate, ['eq', exams.owner, 'owner-id']);
      assert.equal(queries[1].predicate[0], 'inArray');
      assert.equal(queries[1].predicate[1], attempts.exam);
      assert.deepEqual(queries[1].predicate[2].predicate, ['eq', exams.owner, 'owner-id'], 'attempt query must independently scope to owned exams');
      return [data.exams, data.attempts];
    }
  };
  const exports = {};
  const requireMock = name => {
    if (name === 'drizzle-orm') return { eq: (...args) => ['eq', ...args], inArray: (...args) => ['inArray', ...args] };
    if (name === identityImport) return { [identityName]: async () => user };
    if (name === '../../admin-auth') return { isAdmin: () => allowed };
    if (name === '../../../db') return { getDb: () => db };
    if (name === '../../../db/schema') return { exams, attempts };
    throw new Error(`Unexpected import ${name}`);
  };
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, require: requireMock, Response, Date });
  assert.equal((await exports.GET()).status, 401);
  assert.equal(reads, 0);
  user = { userId: 'different-user' };
  assert.equal((await exports.GET()).status, 403);
  assert.equal(reads, 0);
  user = { userId: 'owner-id' }; allowed = true;
  const response = await exports.GET();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  assert.match(response.headers.get('Content-Disposition'), /^attachment;/);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  const backup = await response.json();
  assert.equal(backup.format, 'classroom-check-backup'); assert.equal(backup.version, 1);
  assert.deepEqual(backup.exams, data.exams); assert.deepEqual(backup.attempts, data.attempts);
}
await testRoute(new URL('../app/api/admin-backup/route.ts', import.meta.url), '../../auth', 'getAdminUser');
const originalRoute = new URL('../../classroom/app/api/admin-backup/route.ts', import.meta.url);
if (existsSync(originalRoute)) await testRoute(originalRoute, '../../chatgpt-auth', 'getChatGPTUser');
console.log('PASS: backup endpoint denies anonymous/non-admin callers, scopes both transactional reads to the owner, and returns a private full-fidelity download.');
