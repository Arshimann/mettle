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

## 3. Cloudflare Pages (free alternative)

1. dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the repo. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
3. Save & deploy.

Same `dist/` build works on Vercel, GitHub Pages, etc.

---

## 4. Supabase (only for the later accounts phase)

1. supabase.com → **New project** → name it, set a DB password, pick a region → wait ~2 min.
2. **Project Settings → API** → copy the **Project URL** and the **anon public** key.
3. Put them where the app can read them (not used in v1, but ready):
   - Local: create `C:\Git\mettle\.env` (already git-ignored):
     ```
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...
     ```
   - Netlify: **Site settings → Environment variables** → add the same two keys, then redeploy.
4. **SQL Editor** → paste and run `supabase/migrations/0001_init.sql` to create the
   profiles/social tables for when accounts ship. (Skip until then if you like.)

> Keys: the `anon` key is safe to ship in a client app. Never expose the `service_role` key.
