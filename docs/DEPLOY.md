# Deploying Mettle

Mettle is a static Vite build (`npm run build` → `dist/`). It needs no server.
v1 is local-first, so **Supabase is optional** right now — set it up only when you
want the future accounts/sync phase.

---

## 1. Put the code on GitHub (one time)

1. Create a new **empty** repo on github.com (no README), e.g. `mettle`.
2. In `C:\Git\mettle`:
   ```sh
   git remote add origin https://github.com/<you>/mettle.git
   git push -u origin main
   ```

---

## 2. Deploy to Netlify

**Option A — connect the repo (auto-deploys on every push):**
1. Go to app.netlify.com → **Add new site → Import an existing project → GitHub**.
2. Pick the `mettle` repo.
3. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click **Deploy**. Done — you get a `*.netlify.app` URL.

**Option B — no Git (quick test):**
1. `npm run build` locally.
2. Drag the `dist` folder onto the Netlify dashboard drop zone.

Add it to your phone: open the URL in mobile Safari/Chrome → Share → **Add to Home Screen** (installs as a PWA, works offline).

---

## 3. Cloudflare Pages (free alternative — ready to switch anytime)

Why you'd switch: Cloudflare Pages' free tier has **unlimited bandwidth and requests**
(Netlify's free tier caps at 100 GB/mo). For a service-worker-cached PWA you're very
unlikely to hit Netlify's limit, but Cloudflare removes the ceiling entirely. The build
is identical, so moving is low-risk — keep both connected if you like.

1. dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the repo. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
3. If you use Supabase sync, add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` under
   **Settings → Environment variables** (Production), then redeploy (baked in at build).
4. Save & deploy. Point your domain at it when ready.

SPA routing + deep links are handled by `public/_redirects` (`/*  /index.html  200`),
which ships in the build and works on Netlify, Cloudflare Pages, Vercel, etc.

Same `dist/` build works on Vercel, GitHub Pages, etc.

---

## 4. Supabase (optional — enables account backup + cross-device sync)

The app works 100% offline without this. Set it up when you want your data backed
up and synced across devices. Email + password sign-in.

1. supabase.com → **New project** → name it, set a DB password, pick a region → wait ~2 min.
2. **SQL Editor** → run the migrations **in order**:
   - paste and run `supabase/migrations/0001_init.sql` (creates the `profiles` table),
   - then paste and run `supabase/migrations/0002_sync.sql` (the row-level security
     policies + timestamp trigger that let a user read/write *only their own* data).
3. **Authentication → Sign In / Providers → Email**: make sure **Email** is enabled.
   For a frictionless personal app, turn **Confirm email** *off* — then sign-up logs
   you straight in. (Leave it on if you'd rather verify emails; users then have to
   click a confirmation link before their first login.)
4. **Project Settings → API** → copy the **Project URL** and the **anon public** key.
5. Put them where the app can read them:
   - Local: create `C:\Git\mettle\.env` (already git-ignored):
     ```
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...
     ```
   - Netlify: **Site settings → Environment variables** → add the same two keys, then
     **trigger a redeploy** (env vars are baked in at build time).

Once those env vars are present, a "Backup & sync" section appears in Settings and the
first-launch screen offers sign up / log in (still skippable — "Continue offline").

> Keys: the `anon` key is safe to ship in a client app. Never expose the `service_role` key.
> The `friendships` / `workout_reactions` / `workout_comments` tables from 0001 stay
> locked (no policies) — they're for a future social phase and aren't used yet.
