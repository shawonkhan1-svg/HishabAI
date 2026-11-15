# HishabAI 2026

Encrypted income / expense / savings tracker. Next.js 15, Supabase, Web Crypto E2EE, PWA.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in the two Supabase values
npm run dev
```

## Supabase (one time)
1. Run `supabase/schema.sql` in the SQL Editor.
2. Authentication → Providers: enable **Email** and **Phone** (connect an SMS provider, OTP length 6).
3. Authentication → URL Configuration: set **Site URL** to your Vercel URL and add it (and `http://localhost:3000`) to **Redirect URLs**. The forgot-password link needs this.

## GitHub + Vercel (one time)
1. Push this repo to GitHub (branch `main`).
2. In Vercel: import the project, add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production).
3. Run `npx vercel link` locally once; open `.vercel/project.json` for `orgId` and `projectId`.
4. GitHub repo → Settings → Secrets and variables → Actions, add: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
5. In Vercel → Settings → Git, disconnect the repo (or turn off production deploys) so only the workflow deploys. Otherwise you get two deploys per push.

Every push to `main` deploys. A daily 03:00 (Dhaka) run deploys only if there were commits in the last 24h.
Each build stamps a new version into `public/sw.js` (`scripts/stamp-version.mjs`), so installed apps show "A new version is ready".

## Security model
- Random 256-bit data key encrypts every record (AES-GCM, `userId:rowId` as AAD).
- That key is wrapped by your vault password and by the 12-word recovery phrase (PBKDF2-SHA256, 600k iterations).
- Supabase Auth receives a derived secret, not your raw password.
- Forgot password: email link, then enter the 12 words and a new password. Both the account and the vault are re-keyed.
- **Lose both the password and the recovery phrase and the data is unrecoverable.**
- Dates and categories are inside the ciphertext, so the client downloads and decrypts all rows.
