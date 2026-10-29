# Publish from your PC without AI

Student page: https://cat-500-level-test.cat500-assessments.workers.dev/

Admin page: https://cat-500-level-test.cat500-assessments.workers.dev/admin

## Add questions or run tests

1. Open the live admin page and sign in with your authorized GitHub account.
2. Use **Create test** or **Import test**, select correct answers and save.
3. Select **Open entry** and share the student link plus that test's code.
4. Afterwards, use **View results → Export CSV**. Use **Download backup** for a full private backup.

These actions save directly online. No terminal, deployment or AI is needed. Local-preview tests do not automatically transfer to the live database.

**CAT 500 Level** is already saved with 50 questions, 60 minutes and one mark per question. Entry was left closed after migration. Select **Open entry** when you are ready to admit students.

## Update the app on this PC

1. Open the independent project in your editor:

```text
C:\Users\Baqir-pc\Documents\Codex\2026-10-26\i-wanna-create-a-like-quick\work\classroom-independent
```

2. Edit and save: `app/classroom.tsx` for wording/interface, `app/globals.css` for styling, or `app/layout.tsx` for the browser title.
3. Double-click **Publish to Cloudflare.cmd** in that folder. It checks, rebuilds and publishes your saved code. Alternatively, open PowerShell and run:

```powershell
cd "C:\Users\Baqir-pc\Documents\Codex\2026-10-26\i-wanna-create-a-like-quick\work\classroom-independent"
npm run deploy
```

4. Wait for successful completion and the Cloudflare site address. If the command reports a code/build error, fix it and retry.
5. Refresh both live links and check the change. Ctrl+F5 refreshes an old cached page.

Wrangler is already authorized on this PC. If authorization expires, run `npx wrangler login`, finish browser sign-in and retry.

`npm run deploy` checks, rebuilds and publishes. Do not use `deploy:only` for normal edits: it skips the rebuild and can publish stale code.

**Ordinary deployments keep your saved tests and results.** They do not reset D1 or import local records. Do not change database IDs for a routine update, and avoid deployment during an exam.

## First setup on another PC

Install Node.js 24 LTS and Git, and sign in to GitHub with access to the private repository. Then:

```powershell
git clone https://github.com/Cipher-sage/classroom-check.git
cd classroom-check
npm ci
npx wrangler login
```

Finish Cloudflare sign-in. Then use `npm run deploy` after editing. Production secrets stay in Cloudflare and survive ordinary deployments; do not copy them into source or GitHub.

## Preview changes locally

On a fresh local database, run `npm run db:local`. Then run:

```powershell
npm run dev
```

Open the printed Local URL. Saving changes refreshes the preview. Stop with Ctrl+C, then publish with `npm run deploy`.

Local data is separate from production. Student-page layout can be previewed without admin sign-in. Local admin login requires a separate local GitHub OAuth app and private `.dev.vars` configuration; see ADMIN-AUTH.md and `.dev.vars.example`.

## Save source changes to GitHub

First inspect what will be uploaded:

```powershell
git status
```

The list must not include student exports, backup JSON/SQL, passwords or tokens. Store backups in ignored `private-backups/`. Then:

```powershell
git add .
git commit -m "Describe the update you made"
git push origin main
```

For an easier visual option, open this repository in GitHub Desktop, review the changed files, enter a summary, click **Commit to main**, then **Push origin**.

## Automatic publishing from GitHub — enabled

Cloudflare is connected to this private repository and automatically publishes pushes to `main`. This was verified with commit `040d914` on 29 October 2026; its Cloudflare build completed and deployed successfully.

For each update:

1. Edit your files and **save** them.
2. Commit the changes and **push to `main`**, using the commands above or GitHub Desktop.
3. Open Cloudflare → **Workers & Pages** → **cat-500-level-test** → **Deployments**. Find your latest commit and click its **Build** link to see progress and logs. **Settings → Builds** holds the connection settings.
4. Wait until the build and deployment finish successfully. A successful GitHub push alone does not confirm publication. If the build fails, open its log, fix the reported error, then commit and push the fix.
5. Refresh the student and admin links to check your change.

You do not need to double-click the publisher as well. Use **Publish to Cloudflare.cmd** when you want to publish directly from this PC; save those changes to GitHub afterwards so your backup stays current.

Configured settings, for reference:

- Repository: `Cipher-sage/classroom-check`; production branch: `main`; repository root.
- Build: `npm run typecheck && npm test && npm run build`.
- Deploy: `npm run deploy:only` (safe here because the build has just completed).
- Build environment: `NODE_VERSION=24`; preview builds disabled.

Keep the existing D1 binding and Worker secrets. Do not put passwords, API tokens or student backups in GitHub. These steps require no AI or ChatGPT usage allowance.

Reference: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

## Quick fixes

- `npm` missing: install Node.js and reopen the terminal.
- Packages missing: run `npm ci` in the folder containing `package.json`.
- Cloudflare authorization error: run `npx wrangler login` for the account owning the Worker.
- Admin sign-in unavailable: check OAuth settings in ADMIN-AUTH.md; do not disable authentication.
- Local tables missing: run `npm run db:local`.
- Live schema changes: use `npm run db:remote` only for intentional, reviewed migrations after a backup. Routine wording/style updates do not need it.

Keep your last working source commit and a private database backup for recovery.

