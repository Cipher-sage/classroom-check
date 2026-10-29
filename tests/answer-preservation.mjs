import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import ts from 'typescript';
import * as orm from 'drizzle-orm';
import * as sqliteCore from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/d1';

// Send real route requests to a local SQLite-backed D1 adapter; no live data is used.
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const schema = {};
vm.runInNewContext(compile('../db/schema.ts'), { exports: schema, require: () => sqliteCore });
const sqlite = new DatabaseSync(':memory:');
for (const file of ['0000_broken_outlaw_kid.sql', '0001_needy_sheva_callister.sql']) {
  sqlite.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
}
const binding = {
  prepare(sql) {
    return { bind(...params) {
      const execute = method => {
        const statement = sqlite.prepare(sql);
        if (method === 'run') return { success: true, meta: statement.run(...params) };
        if (method === 'raw') statement.setReturnArrays(true);
        const rows = statement.all(...params);
        return method === 'raw' ? rows : { results: rows };
      };
      return { run: async () => execute('run'), raw: async () => execute('raw'), all: async () => execute('all') };
    } };
  }
};
const db = drizzle(binding, { schema });
const now = 1_800_000_000_000;
class Clock extends Date { static now() { return now; } }
const route = {}, errors = [];
const requireMock = name => {
  if (name === 'drizzle-orm') return orm;
  if (name === '../../../db/schema') return schema;
  if (name === '../../../db') return { getDb: () => db };
  if (name === '../../auth') return { getAdminUser: async () => null, getAuthConfig: () => ({}) };
  if (name === '../../admin-auth') return { isAdmin: () => false };
  if (name === '../../auth-core') return { validMutationOrigin: () => true };
  if (name === '../../roster') return {};
  throw Error(`Unexpected import ${name}`);
};
vm.runInNewContext(compile('../app/api/test/route.ts'), {
  exports: route, require: requireMock, Response, URL, Date: Clock,
  console: { error: (...args) => errors.push(args) }
});

const questions = [1, 2, 3].map(i => ({
  id: `q${i}`, text: `Question ${i}`,
  options: ['A', 'B', 'C', 'D'].map(letter => ({ id: `q${i}${letter}`, text: letter })),
  correct: `q${i}${['B', 'C', 'D'][i - 1]}`
}));
const paper = [questions[2], questions[0], questions[1]].map(({ correct, ...question }) => ({
  ...question, options: [...question.options].reverse()
}));
const stored = { q1: 'q1A', q2: 'q2C', q3: 'q3D' };
const warning = { at: now - 2000, type: 'Warning: focus loss' };
sqlite.prepare('INSERT INTO exams (id,owner,title,course,minutes,code,questions,open,created) VALUES (?,?,?,?,?,?,?,?,?)')
  .run('exam', 'github:owner', 'Synthetic preservation test', 'Test', 60, 'TESTCODE', JSON.stringify(questions), 1, now - 10000);
const insert = sqlite.prepare('INSERT INTO attempts (id,exam,name,matric,department,paper,answers,flags,start,deadline,submitted,score,total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
const add = id => insert.run(id, 'exam', 'Synthetic Student', id, '', JSON.stringify(paper), JSON.stringify(stored), JSON.stringify([warning]), now - 1000, now + 60000, null, null, 3);
const row = id => ({ ...sqlite.prepare('SELECT * FROM attempts WHERE id=?').get(id) });
async function send(id, action, extras = {}) {
  const response = await route.POST(new Request('https://exam.example/api/test', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://exam.example' },
    body: JSON.stringify({ action, token: id, ...extras })
  }));
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify({ body, errors }));
  return body;
}

add('save');
let body = await send('save', 'save', { answers: {} });
assert.deepEqual(body.answers, stored, 'an empty save must preserve every stored answer');
assert.deepEqual(JSON.parse(row('save').answers), stored);
assert.deepEqual(JSON.parse(row('save').flags), [warning], 'an empty save creates no answer-timing events');

body = await send('save', 'save', { answers: { q1: 'q1B' } });
const corrected = { ...stored, q1: 'q1B' };
assert.deepEqual(body.answers, corrected, 'a smaller save updates its valid choice and preserves omitted choices');
assert.deepEqual(JSON.parse(row('save').answers), corrected);
assert.deepEqual(JSON.parse(row('save').flags), [warning, { at: now, type: 'answer', q: 'q1' }]);

body = await send('save', 'save', { answers: { q2: 'not-an-option', unknown: 'q3D' } });
assert.deepEqual(body.answers, corrected, 'invalid and unknown choices must not overwrite stored answers');
assert.equal(JSON.parse(row('save').flags).filter(flag => flag.type === 'answer').length, 1);
body = await send('save', 'save');
assert.deepEqual(body.answers, corrected, 'a missing answers object must preserve stored answers');
assert.equal(JSON.parse(row('save').flags).filter(flag => flag.type === 'answer').length, 1);

add('submit');
assert.deepEqual(await send('submit', 'submit', { answers: { q1: 'q1B' } }), { submitted: true });
const submitted = row('submit');
assert.deepEqual(JSON.parse(submitted.answers), corrected, 'partial submission preserves omitted answers before grading');
assert.equal(submitted.score, 3);
assert.equal(submitted.submitted, now);
await send('submit', 'save', { answers: { q2: 'q2A' } });
assert.deepEqual(row('submit'), submitted, 'late saves cannot mutate a submitted result');

for (const [id, extras, expected, score] of [
  ['exit-empty', { answers: {} }, stored, 2],
  ['exit-missing', {}, stored, 2],
  ['exit-partial', { answers: { q1: 'q1B' } }, corrected, 3],
  ['exit-invalid', { answers: { q2: 'invalid', unknown: 'q1B' } }, stored, 2]
]) {
  add(id);
  assert.deepEqual(await send(id, 'exit', { type: 'pagehide', ...extras }), { submitted: true });
  const result = row(id);
  assert.deepEqual(JSON.parse(result.answers), expected, `${id} must retain all stored answers except valid replacements`);
  assert.equal(result.score, score, `${id} must grade the merged answers`);
  assert.equal(result.submitted, now);
  assert.deepEqual(JSON.parse(result.flags), [warning, { at: now, type: 'Auto-submitted: left page' }]);
}

assert.deepEqual(errors, []);
sqlite.close();
console.log('PASS: empty, missing and smaller saves preserve stored answers; valid choices update, invalid choices do not erase, timing logs only changes, and partial submission/exit grade merged answers.');
