import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import ts from 'typescript';
import * as orm from 'drizzle-orm';
import * as sqliteCore from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/d1';

// Exercise the real route and Drizzle-generated SQL against SQLite, with a D1 query budget.
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const schema = {};
vm.runInNewContext(compile('../db/schema.ts'), { exports: schema, require: () => sqliteCore });
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../drizzle/0000_broken_outlaw_kid.sql', import.meta.url), 'utf8'));
sqlite.exec(readFileSync(new URL('../drizzle/0001_needy_sheva_callister.sql', import.meta.url), 'utf8'));
let queries = [];
const binding = {
  prepare(sql) {
    return { bind(...params) {
      const execute = method => {
        queries.push(sql);
        assert.ok(queries.length <= 50, 'must remain within the D1 Free invocation query limit');
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
let user = { userId: 'github:owner' }, allowed = true;
const route = {}, errors = [];
const requireMock = name => {
  if (name === 'drizzle-orm') return orm;
  if (name === '../../../db/schema') return schema;
  if (name === '../../../db') return { getDb: () => db };
  if (name === '../../auth') return { getAdminUser: async () => user, getAuthConfig: () => ({}) };
  if (name === '../../admin-auth') return { isAdmin: () => allowed };
  if (name === '../../auth-core') return { validMutationOrigin: () => true };
  if (name === '../../roster') return {};
  throw Error(`Unexpected import ${name}`);
};
vm.runInNewContext(compile('../app/api/test/route.ts'), {
  exports: route, require: requireMock, Response, URL, Date: Clock,
  console: { error: (...args) => errors.push(args) }
});

const questions = Array.from({ length: 50 }, (_, i) => {
  const id = i === 0 ? 'question.with"quoted-key' : `question-${i}`;
  const options = Array.from({ length: 4 }, (_, k) => ({ id: `option-${i}-${k}`, text: `Choice ${k}` }));
  return { id, text: `Question ${i}`, options, correct: options[(i + 1) % 4].id };
});
const insertExam = sqlite.prepare('INSERT INTO exams (id,owner,title,course,minutes,code,questions,open,created) VALUES (?,?,?,?,?,?,?,?,?)');
for (const [id, owner] of [['owned', 'github:owner'], ['unrelated', 'github:someone-else']]) {
  insertExam.run(id, owner, id, 'Test', 60, id.toUpperCase(), JSON.stringify(questions), 0, now - 3_600_000);
}
const paper = JSON.stringify([...questions].reverse().map(({ correct, ...q }) => ({ ...q, options: [...q.options].reverse() })));
const flags = JSON.stringify([{ at: now - 50_000, type: 'Warning: focus loss' }]);
const makeAnswers = correctCount => Object.fromEntries(questions.map((q, i) => [q.id, i < correctCount ? q.correct : q.options.find(o => o.id !== q.correct).id]));
const insertAttempt = sqlite.prepare('INSERT INTO attempts (id,exam,name,matric,department,paper,answers,flags,start,deadline,submitted,score,total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
const add = (id, exam, answers, deadline, submitted = null, score = null) => insertAttempt.run(id, exam, 'Synthetic Test', id, '', paper, JSON.stringify(answers), flags, now - 3_600_000, deadline, submitted, score, 50);
const expected = new Map();
for (let i = 0; i < 102; i++) {
  const score = i % 51;
  const answers = i === 0 ? {} : makeAnswers(score);
  answers['unrelated-question'] = questions[0].correct;
  add(`expired-${i}`, 'owned', answers, now - i * 1000);
  expected.set(`expired-${i}`, score);
}
add('active', 'owned', makeAnswers(50), now + 1);
add('submitted', 'owned', makeAnswers(50), now - 1000, now - 1500, 17);
add('other-exam', 'unrelated', makeAnswers(50), now - 1000);
const allRows = () => sqlite.prepare('SELECT * FROM attempts ORDER BY id').all().map(r => ({ ...r }));
const before = allRows();
const request = id => new Request('https://exam.example/api/test', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://exam.example' },
  body: JSON.stringify({ action: 'results', id })
});
async function results(id = 'owned') {
  queries = [];
  const response = await route.POST(request(id));
  return { response, body: await response.json() };
}

let result = await results();
assert.equal(result.response.status, 200, errors.map(args => args.map(value => value?.cause?.message || value?.message || String(value)).join(': ')).join('\n'));
assert.equal(queries.length, 3, 'ownership read, one atomic finalization, one results read regardless of 102 expired rows');
assert.equal(queries.filter(q => /^update /i.test(q)).length, 1);
assert.equal(result.body.results.length, 104, 'only owned exam attempts appear');
for (const row of result.body.results) {
  assert.ok(!('paper' in row) && !('answers' in row), 'private answer paper is not included in results payload');
  if (expected.has(row.id)) {
    assert.equal(row.score, expected.get(row.id), `stable-ID score for ${row.id}`);
    assert.equal(row.submitted, row.deadline, 'expired submissions use their exact deadline');
  }
}
const after = allRows();
for (const [i, row] of after.entries()) {
  assert.deepEqual(row, expected.has(row.id)
    ? { ...before[i], score: expected.get(row.id), submitted: before[i].deadline }
    : before[i], 'only expired owned attempt score/submitted may change');
}
result = await results();
assert.equal(result.response.status, 200);
assert.equal(queries.length, 3);
assert.deepEqual(allRows(), after, 'repeated result loading is idempotent');

result = await results('unrelated');
assert.equal(result.response.status, 404);
assert.equal(queries.length, 1, 'another owner cannot finalize or read an exam');
user = null;
result = await results();
assert.equal(result.response.status, 401);
assert.equal(queries.length, 0);
user = { userId: 'github:owner' }; allowed = false;
result = await results();
assert.equal(result.response.status, 403);
assert.equal(queries.length, 0);
assert.deepEqual(allRows(), after);
assert.deepEqual(errors, []);
sqlite.close();
console.log('PASS: 102 expired attempts graded atomically in 3 queries; 50-question stable-ID scoring, deadline boundary, idempotence, owner isolation, and active/submitted rows preserved.');
