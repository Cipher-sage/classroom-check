# CAT 500 Level Test

A classroom test app you own and can publish from your PC without ChatGPT or Codex.

- Student page: https://cat-500-level-test.cat500-assessments.workers.dev/
- Private admin page: https://cat-500-level-test.cat500-assessments.workers.dev/admin
- Private source: https://github.com/Cipher-sage/classroom-check
- Cloudflare Worker: `cat-500-level-test`; D1 database: `classroom-check`, binding `DB`.

**Start with [PC-PUBLISHING.md](PC-PUBLISHING.md).**

## Manage tests

Sign in at `/admin` with your authorized GitHub account. Create a test or import a question JSON file, choose each correct answer, save, then open entry. Students use their matriculation number and access code. Each question is worth one mark; question and option shuffling preserves the correct answer IDs.

The migrated **CAT 500 Level** test has 50 questions, a 60-minute duration and one mark per question. Entry was left closed after migration; select **Open entry** when you are ready for students to join.

Creating tests, opening/closing entry, viewing results and exporting records update the live database directly. They require no code publication or AI. There is currently no Edit existing test button: create a replacement for changed questions or duration and use its new code.

Only the administrator can view scores and answer keys. Students get a completion message without their scores. Leaving the test screen triggers automatic submission and locks the attempt. Offline devices and forced browser termination can delay delivery; continue classroom supervision.

## Publish code

Requires Node.js 22.13+ (Node 24 LTS recommended), npm, Git and your Cloudflare account.

On this PC, save your code changes and double-click **Publish to Cloudflare.cmd** in the project folder. Wait for **Published**, then refresh the live site. You can also use PowerShell:

```powershell
# Once after cloning:
npm ci
# After saving code changes:
npm run deploy
```

The deploy command checks TypeScript, builds, and publishes to your Cloudflare Worker. Wrangler is already authorized on this PC. On another PC, run `npx wrangler login` once and finish browser sign-in.

Ordinary deployment preserves your D1 tests/results. Database migrations and backup imports are separate operations. Preserve the account ID, database ID and `DB` binding in `wrangler.json`.

**Automatic publishing from GitHub is enabled and verified.** Save changes, commit and push to `main`, then wait for a successful Cloudflare build before checking the live site. The first verified GitHub deployment was commit `040d914` on 29 October 2026. See the PC guide for step-by-step instructions; the double-click publisher remains a manual alternative.

## Project framework

| Part | Technology / files |
| --- | --- |
| Interface | React + TypeScript, Next.js-style routes through Vinext/Vite; `app/classroom.tsx` |
| Appearance | `app/globals.css`; browser title in `app/layout.tsx` |
| Server and grading | Cloudflare Worker; `app/api/test/route.ts` |
| Persistent records | D1 (SQLite) through Drizzle; `db/` and `drizzle/` |
| Admin identity | Your GitHub OAuth app; `app/auth.ts` and `app/api/auth/` |
| Publishing | Cloudflare Workers Builds on GitHub `main`, or Wrangler from your PC |

This version does not depend on Sites hosting or ChatGPT sign-in. GitHub numeric ID `180553969` is the configured administrator, and ownership is `github:180553969`. See [ADMIN-AUTH.md](ADMIN-AUTH.md). Keep production secrets in Cloudflare Worker secrets, never GitHub. Sessions expire on the server after one hour; the dashboard also signs out after ten minutes of inactivity.

## Local preview

```powershell
npm run db:local
npm run dev
```

Open the printed Local URL; Ctrl+C stops it. Local data is separate from production. Local admin login needs separate GitHub OAuth settings; see `.dev.vars.example` and ADMIN-AUTH.md. There is no development authentication bypass.

Checks:

```powershell
npm run typecheck
npm test
```

Use Node 24 LTS for the backup-import test, which uses Node's SQLite module.

## Private backups

**Download backup** in admin exports complete owner records, including questions, answer keys, attempts, answers and scores. **Export CSV** is only a results report. Deleting a test permanently removes its attempts/results too.

Keep backup JSON/SQL inside ignored `private-backups/` or outside the repository. Never commit student data or secrets. To prepare an authorized backup for a new database:

```powershell
node scripts/prepare-import.mjs --input "C:\path\to\backup.json" --admin-github-id 180553969 --output migration.sql
```

The importer validates IDs, links, shuffled papers, answer keys and scores; preserves records/IDs; remaps ownership; and closes imported entry. It refuses active-at-export attempts, existing output files and conflicting database inserts. Close old-site entry, wait for attempts to finish, then download a fresh backup. Waiting for a stale backup's deadline does not make it safe to migrate.

Import into the intended initialized destination only. A failed import may be partial; use a fresh destination or inspect it before retrying. Records exceeding D1's SQL statement size limit need a parameterized import. Verify counts and scores before opening new entry. Keep the old site available until verified, and do not run an exam across both addresses.

