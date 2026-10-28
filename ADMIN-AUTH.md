# Independent administrator authentication

This version uses your own GitHub OAuth application. It does not use ChatGPT identity headers, a Sites login, or a shared student code for administrator access.

Configure these Cloudflare Worker variables/secrets:

- `APP_ORIGIN`: the exact public origin without a trailing slash, e.g. `https://your-worker.your-subdomain.workers.dev`.
- `ADMIN_GITHUB_ID`: your numeric GitHub user ID, not your username or email. Only this ID is allowed.
- `GITHUB_CLIENT_ID`: your GitHub OAuth application's client ID.
- `GITHUB_CLIENT_SECRET`: its secret; store it as a Worker secret.
- `SESSION_SECRET`: at least 32 random characters; store it as a Worker secret. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` on your own PC. Rotating this secret invalidates all current sessions.

In your GitHub OAuth app, set the homepage to APP_ORIGIN and the authorization callback URL to `APP_ORIGIN/api/auth/callback`. Keep wildcard matching disabled. The app requests no repository or email scopes: it only verifies your GitHub ID.

The administrator signs in at `/admin`. OAuth uses browser-bound signed state and PKCE S256. The app uses the GitHub token only for its immediate identity check; it never saves the GitHub token or sends it to the browser. The site session is an HMAC-signed, HttpOnly cookie, with Secure and a host-only cookie name in production. A local HTTP loopback origin is supported for local development with a separate OAuth app/callback; no mock login is built into this authentication.

The server rejects sessions after one hour, regardless of activity. The dashboard also signs out after ten minutes of inactivity and hides private content immediately on sign-out. Inactivity detection is a browser privacy feature; the one-hour maximum is enforced on the server. Signing out deletes the local cookie; rotating SESSION_SECRET revokes all copies of all signed sessions.

All test ownership uses `github:<ADMIN_GITHUB_ID>`. Migrated exam owner fields must be remapped to this value before their records will appear. Student entry and grading do not use GitHub.

Never put secrets in public JavaScript, GitHub, a question import, or a browser URL. Sign-in fails closed if the configuration is missing or invalid. The configuration's origin is used for OAuth callbacks and redirects, rather than trusting a Host header. Sign-out accepts only same-origin POST requests.

Official OAuth flow: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
