# Publish from your PC without AI

Student page: https://cat-500-level-test.cat500-assessments.workers.dev/

Admin page: https://cat-500-level-test.cat500-assessments.workers.dev/admin

## Add questions or run tests

1. Open the live admin page and sign in with your authorized GitHub account.
2. Use **Create test** or **Import test**, select correct answers and save.
3. Select **Open entry** and share the student link plus that test's code.
4. Afterwards, use **View results → Export CSV**. Use **Download backup** for a full private backup.

These actions save directly online. No terminal, deployment or AI is needed. Local-preview tests do not automatically transfer to the live database.

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

GitHub Desktop's Commit and Push origin buttons work too. A push saves source; it does not prove the live site was updated.

## Optional: publish automatically on GitHub pushes

This is an optional account setup. **Do not assume it is enabled.**

1. Cloudflare dashboard → **Workers & Pages** → **cat-500-level-test** → **Settings → Builds**.
2. Connect GitHub and grant access to private repository `Cipher-sage/classroom-check`.
3. Choose production branch `main` and the repository root.
4. Build command: `npm run typecheck && npm run build`. Deploy command: `npm run deploy:only`. Choose Node 24 if a build-runtime setting is shown.
5. Complete Cloudflare's build/deploy authorization prompts. Keep the existing D1 binding and Worker secrets; do not put API tokens in source.
6. Trigger a build and verify its success and correct live address before relying on it.

After this is verified, the process is **edit → commit → push → check Cloudflare build status**, with no AI.

Reference: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

## Quick fixes

- `npm` missing: install Node.js and reopen the terminal.
- Packages missing: run `npm ci` in the folder containing `package.json`.
- Cloudflare authorization error: run `npx wrangler login` for the account owning the Worker.
- Admin sign-in unavailable: check OAuth settings in ADMIN-AUTH.md; do not disable authentication.
- Local tables missing: run `npm run db:local`.
- Live schema changes: use `npm run db:remote` only for intentional, reviewed migrations after a backup. Routine wording/style updates do not need it.

Keep your last working source commit and a private database backup for recovery.

