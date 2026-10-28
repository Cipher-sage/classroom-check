import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXAM_KEYS = ['id', 'owner', 'title', 'course', 'minutes', 'code', 'questions', 'open', 'created'];
const ATTEMPT_KEYS = ['id', 'exam', 'name', 'matric', 'department', 'paper', 'answers', 'flags', 'start', 'deadline', 'submitted', 'score', 'total'];
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = message => { throw new Error(message); };
function object(value, label) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`); return value; }
function keys(value, expected, label) {
  object(value, label);
  if (Object.keys(value).sort().join('|') !== [...expected].sort().join('|')) fail(`${label} has missing or unsupported fields. Use an unmodified version-1 backup.`);
}
function text(value, label, max, empty = false) {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.length > max || value.includes('\0')) fail(`${label} is not valid text.`);
  return value;
}
function integer(value, label, min, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(`${label} is not a valid integer.`);
  return value;
}
function parse(value, label) {
  text(value, label, 2_000_000);
  try { return JSON.parse(value); } catch { fail(`${label} is not valid JSON.`); }
}
function unique(set, value, label) { if (set.has(value)) fail(`Duplicate ${label}.`); set.add(value); }
function questionMap(raw, label) {
  const questions = parse(raw, label);
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 100) fail(`${label} must contain 1–100 questions.`);
  const byId = new Map(), optionIds = new Set();
  for (const q of questions) {
    keys(q, ['id', 'text', 'options', 'correct'], `${label} question`);
    text(q.id, 'Question ID', 200); text(q.text, 'Question text', 2000);
    if (byId.has(q.id)) fail('Duplicate question ID.');
    if (!Array.isArray(q.options) || q.options.length !== 4) fail('Every question must have four options.');
    const options = new Map();
    for (const option of q.options) {
      keys(option, ['id', 'text'], 'Question option');
      text(option.id, 'Option ID', 200); text(option.text, 'Option text', 500);
      unique(optionIds, option.id, 'option ID'); options.set(option.id, option.text);
    }
    if (!options.has(q.correct)) fail('A correct-answer ID does not belong to its question.');
    byId.set(q.id, { text: q.text, options, correct: q.correct });
  }
  return byId;
}

export function validateBackup(backup, adminGithubId, now = Date.now()) {
  if (!/^[1-9][0-9]*$/.test(adminGithubId ?? '')) fail('Supply your numeric GitHub user ID with --admin-github-id.');
  keys(backup, ['format', 'version', 'exportedAt', 'exams', 'attempts'], 'Backup');
  if (backup.format !== 'classroom-check-backup' || backup.version !== 1) fail('Unsupported backup format/version.');
  const exportedAt = Date.parse(backup.exportedAt);
  if (typeof backup.exportedAt !== 'string' || !Number.isSafeInteger(exportedAt) || exportedAt < 0 || exportedAt > now + 60_000) fail('Invalid backup export timestamp.');
  if (!Array.isArray(backup.exams) || !Array.isArray(backup.attempts)) fail('Backup exams and attempts must be arrays.');
  const exams = new Map(), codes = new Set(), owners = new Set(), attemptIds = new Set(), matricKeys = new Set();
  for (const exam of backup.exams) {
    keys(exam, EXAM_KEYS, 'Exam');
    text(exam.id, 'Exam ID', 200); text(exam.owner, 'Exam owner', 200); owners.add(exam.owner);
    if (exams.has(exam.id)) fail('Duplicate exam ID.');
    text(exam.title, 'Exam title', 150); text(exam.course, 'Course', 500);
    integer(exam.minutes, 'Duration', 1, 180);
    text(exam.code, 'Class code', 20); unique(codes, exam.code, 'class code');
    integer(exam.open, 'Entry state', 0, 1); integer(exam.created, 'Created time', 0, exportedAt);
    exams.set(exam.id, { row: exam, questions: questionMap(exam.questions, 'Exam questions') });
  }
  if (owners.size > 1) fail('Backup contains more than one exam owner. Export only the authorized administrator’s records.');
  for (const attempt of backup.attempts) {
    keys(attempt, ATTEMPT_KEYS, 'Attempt');
    text(attempt.id, 'Attempt ID', 200); unique(attemptIds, attempt.id, 'attempt ID');
    const exam = exams.get(attempt.exam);
    if (!exam) fail('An attempt refers to an exam missing from this backup.');
    text(attempt.name, 'Student name', 150, true); text(attempt.department, 'Department', 150, true); text(attempt.matric, 'Matriculation number', 150);
    unique(matricKeys, JSON.stringify([attempt.exam, attempt.matric]), 'matriculation number within an exam');
    integer(attempt.start, 'Start time', 0, exportedAt); integer(attempt.deadline, 'Deadline', attempt.start + 1);
    if (attempt.deadline - attempt.start !== exam.row.minutes * 60_000) fail('An attempt’s allotted time does not match its exam.');
    integer(attempt.total, 'Question total', 1, 100);
    if (attempt.total !== exam.questions.size) fail('An attempt’s total does not match its exam questions.');
    const paper = parse(attempt.paper, 'Attempt paper');
    if (!Array.isArray(paper) || paper.length !== exam.questions.size) fail('An attempt paper has missing or extra questions.');
    const paperIds = new Set();
    for (const q of paper) {
      keys(q, ['id', 'text', 'options'], 'Attempt question');
      unique(paperIds, q.id, 'question in an attempt');
      const original = exam.questions.get(q.id);
      if (!original || q.text !== original.text || !Array.isArray(q.options) || q.options.length !== 4) fail('An attempt question differs from its source exam.');
      const optionIds = new Set();
      for (const option of q.options) {
        keys(option, ['id', 'text'], 'Attempt option');
        unique(optionIds, option.id, 'option in an attempt question');
        if (original.options.get(option.id) !== option.text) fail('An attempt option differs from its source exam.');
      }
    }
    const answers = object(parse(attempt.answers, 'Saved answers'), 'Saved answers');
    for (const [id, selected] of Object.entries(answers)) {
      if (!exam.questions.get(id)?.options.has(selected)) fail('A saved answer refers to an unknown question or option.');
    }
    const expectedScore = [...exam.questions].reduce((score, [id, q]) => score + (answers[id] === q.correct ? 1 : 0), 0);
    if (attempt.submitted === null) {
      // A snapshot taken mid-test can become stale even after its deadline. Require a fresh export.
      if (attempt.deadline > exportedAt || attempt.deadline > now) fail('The backup contains an active attempt. Close old-site entry, wait for attempts to finish, then download a fresh backup.');
      if (attempt.score !== null) fail('An unsubmitted attempt unexpectedly contains a stored score.');
    } else {
      integer(attempt.submitted, 'Submission time', attempt.start, Math.min(attempt.deadline, exportedAt));
      integer(attempt.score, 'Stored score', 0, attempt.total);
      if (attempt.score !== expectedScore) fail('A stored score does not match its answers and answer key. Import stopped.');
    }
    const flags = parse(attempt.flags, 'Review flags');
    if (!Array.isArray(flags)) fail('Review flags must be an array.');
    for (const flag of flags) { object(flag, 'Review flag'); integer(flag.at, 'Flag timestamp', attempt.start, exportedAt); text(flag.type, 'Flag description', 500); }
  }
  return { exams: backup.exams.map(exam => ({ ...exam, owner: `github:${adminGithubId}`, open: 0 })), attempts: backup.attempts };
}

function sqlValue(value) {
  if (value === null) return 'NULL';
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  if (typeof value === 'string' && !value.includes('\0')) return `'${value.replaceAll("'", "''")}'`;
  fail('Unsupported SQL value.');
}

export function makeImportSql(backup, adminGithubId, now = Date.now()) {
  const data = validateBackup(backup, adminGithubId, now);
  const statements = [
    '-- PRIVATE BACKUP: includes student records and answer keys. Never commit this file.',
    '-- Import into a new, initialized D1 database. Ordinary INSERT deliberately refuses existing IDs/codes.',
    '-- All imported test entries are closed. Existing attempt tokens, answers, scores and timestamps are preserved.'
  ];
  for (const [table, rows, columns] of [['exams', data.exams, EXAM_KEYS], ['attempts', data.attempts, ATTEMPT_KEYS]]) {
    for (const row of rows) {
      const statement = `INSERT INTO "${table}" (${columns.map(x => `"${x}"`).join(',')}) VALUES (${columns.map(x => sqlValue(row[x])).join(',')});`;
      if (Buffer.byteLength(statement, 'utf8') > 100_000) fail('A record exceeds D1’s SQL statement size limit; this backup needs a parameterized import. No SQL file was written.');
      statements.push(statement);
    }
  }
  return `${statements.join('\n')}\n`;
}

async function main() {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--input', '--admin-github-id', '--output'].includes(args[i]) || !args[i + 1] || Object.hasOwn(options, args[i])) fail('Usage: node scripts/prepare-import.mjs --input <backup.json> --admin-github-id <numeric-ID> [--output <filename.sql>]');
    options[args[i]] = args[i + 1];
  }
  if (!options['--input'] || !options['--admin-github-id']) fail('Usage: node scripts/prepare-import.mjs --input <backup.json> --admin-github-id <numeric-ID> [--output <filename.sql>]');
  const input = path.resolve(options['--input']);
  if ((await stat(input)).size > 100 * 1024 * 1024) fail('Backup is larger than this importer’s 100 MB limit.');
  const backup = JSON.parse(await readFile(input, 'utf8'));
  const sql = makeImportSql(backup, options['--admin-github-id']);
  const filename = options['--output'] ?? `migration-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.sql$/.test(filename) || path.basename(filename) !== filename) fail('--output must be a simple .sql filename, not a directory or absolute path.');
  const directory = path.join(projectRoot, 'private-backups');
  await mkdir(directory, { recursive: true });
  const output = path.join(directory, filename);
  await writeFile(output, sql, { flag: 'wx', mode: 0o600 });
  console.log(`Verified ${backup.exams.length} exams and ${backup.attempts.length} attempts. All imported entry states will be closed.`);
  console.log(`Private SQL written to ${output}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(`Import preparation stopped: ${error.message}`); process.exitCode = 1; });
