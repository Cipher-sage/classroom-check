import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { validateBackup, makeImportSql } from '../scripts/prepare-import.mjs';

const questions = [1, 2].map(n => ({ id: `q${n}`, text: `Question ${n}: O'Brien's test`, options: [1, 2, 3, 4].map(k => ({ id: `q${n}o${k}`, text: `Choice ${k}` })), correct: `q${n}o1` }));
const baseline = {
  format: 'classroom-check-backup', version: 1, exportedAt: new Date(3_000_000).toISOString(),
  exams: [{ id: 'e1', owner: 'site:old-owner', title: "O'Brien; DROP TABLE exams; --", course: 'CAT 500', minutes: 1, code: 'PRIVATE123', questions: JSON.stringify(questions), open: 1, created: 1 }],
  attempts: [{ id: 'a1', exam: 'e1', name: "O'Brien", matric: '2026/001', department: 'Medicine', paper: JSON.stringify([...questions].reverse().map(({ correct, ...q }) => ({ ...q, options: [...q.options].reverse() }))), answers: JSON.stringify({ q1: 'q1o1', q2: 'q2o3' }), flags: JSON.stringify([{ at: 1_020_000, type: 'Auto-submitted: left test screen' }]), start: 1_000_000, deadline: 1_060_000, submitted: 1_030_000, score: 1, total: 2 }]
};
const now = 4_000_000;
const fresh = () => structuredClone(baseline);
const valid = validateBackup(baseline, '12345', now);
assert.equal(valid.exams[0].owner, 'github:12345');
assert.equal(valid.exams[0].open, 0);
assert.deepEqual(valid.attempts, baseline.attempts, 'all student records remain intact');
assert.equal(baseline.exams[0].owner, 'site:old-owner', 'conversion must not mutate the supplied backup');
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../drizzle/0000_broken_outlaw_kid.sql', import.meta.url), 'utf8'));
const sql = makeImportSql(baseline, '12345', now);
db.exec(sql);
assert.deepEqual({ ...db.prepare('SELECT * FROM exams').get() }, valid.exams[0], 'escaped SQL round-trips the complete exam');
assert.deepEqual({ ...db.prepare('SELECT * FROM attempts').get() }, baseline.attempts[0], 'shuffled paper, saved answer IDs and scores survive SQL import');
assert.throws(() => db.exec(sql), /UNIQUE constraint failed/, 'a repeated import must refuse conflicting records');
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM exams').get().n, 1);
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM attempts').get().n, 1);
db.close();
const invalid = (change, match) => { const backup = fresh(); change(backup); assert.throws(() => validateBackup(backup, '12345', now), match); };
invalid(b => { b.version = 2; }, /format\/version/);
invalid(b => { b.attempts[0].exam = 'missing'; }, /missing/);
invalid(b => { b.attempts[0].score = 0; }, /stored score/i);
invalid(b => { b.attempts[0].total = 1; }, /total/);
invalid(b => { b.attempts[0].answers = '{"q1":"q2o1"}'; }, /unknown/);
invalid(b => { const q = JSON.parse(b.exams[0].questions); q[0].correct = 'missing'; b.exams[0].questions = JSON.stringify(q); }, /correct-answer/);
invalid(b => { const q = JSON.parse(b.exams[0].questions); q[1].id = q[0].id; b.exams[0].questions = JSON.stringify(q); }, /Duplicate question/);
invalid(b => { b.attempts.push({ ...b.attempts[0], id: 'a2' }); }, /Duplicate matriculation/);
invalid(b => { const p = JSON.parse(b.attempts[0].paper); p[0].options[0].text = 'Changed'; b.attempts[0].paper = JSON.stringify(p); }, /option differs/);
invalid(b => { b.exams[0].unsupportedField = true; }, /unsupported fields/);
invalid(b => { b.exams[0].title = 'bad\0value'; }, /valid text/);
invalid(b => { b.exportedAt = new Date(1_040_000).toISOString(); b.attempts[0].submitted = null; b.attempts[0].score = null; }, /active attempt/, 'a stale snapshot cannot be imported merely by waiting for its deadline');
const expired = fresh(); expired.attempts[0].submitted = null; expired.attempts[0].score = null;
assert.equal(validateBackup(expired, '12345', now).attempts[0].score, null, 'expired unsubmitted attempts remain recoverable for server finalization');
assert.throws(() => makeImportSql(baseline, 'not-a-numeric-ID', now), /numeric GitHub/);
console.log('PASS: full backup validation, stable answer IDs, stored-score verification, SQL escaping/round-trip, ownership mapping, closed entry, active-attempt refusal and duplicate-import conflict.');
