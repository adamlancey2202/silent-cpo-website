# Site analytics (Google Analytics 4)

## Tracking (already on your site)

1. **Admin → Analytics** on silentcpo.me: save **Measurement ID** (`G-…`).
2. The site injects the Google tag automatically. Check **GA4 → Reports → Realtime** after visiting the homepage.

## Performance panel in admin

**Content** or **Analytics** → **Show traffic & search performance** needs the steps below.

You must already have saved in **Admin → Analytics**:

- Measurement ID  
- Numeric **Property ID**  
- **Search Console site URL** (exact match from Search Console)

---

## Service account setup (step by step)

This creates `GOOGLE_SERVICE_ACCOUNT_JSON` on Vercel so the server can read GA4 and Search Console reports.

### Step 1 — Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with the same Google account you use for Analytics.
3. Top bar: click the project name → **New project**.
4. Name it e.g. `SilentCPO analytics` → **Create**.
5. Make sure that project is selected in the top bar.

### Step 2 — Enable APIs

1. Menu (☰) → **APIs & Services** → **Library**.
2. Search **Google Analytics Data API** → open it → **Enable**.
3. Back to **Library**, search **Google Search Console API** → **Enable**.

### Step 3 — Create service account + JSON key

1. Menu → **APIs & Services** → **Credentials**.
2. **+ Create credentials** → **Service account**.
3. Name: e.g. `silentcpo-analytics-reader` → **Create and continue**.
4. Role: optional (you can skip) → **Continue** → **Done**.
5. Click the new service account in the list.
6. Tab **Keys** → **Add key** → **Create new key** → **JSON** → **Create**.
7. A `.json` file downloads. Keep it private (like a password).

Open the file in a text editor. You will see:

- `"client_email": "something@....iam.gserviceaccount.com"` — copy this email for steps 4–5.
- The whole file contents go into Vercel in step 6.

### Step 4 — Allow access in GA4

1. Open [Google Analytics](https://analytics.google.com/) → **Admin**.
2. **Property access management** (middle column).
3. **+** (top right) → **Add users**.
4. Paste the **service account email** from the JSON (`client_email`).
5. Role: **Viewer** → uncheck “Notify people” → **Add**.

### Step 5 — Allow access in Search Console

1. Open [Google Search Console](https://search.google.com/search-console).
2. Pick your property (`silentcpo.me` / `www`).
3. **Settings** (gear) → **Users and permissions**.
4. **Add user** → paste the same **service account email**.
5. Permission: **Full** or **Restricted** (must allow performance data) → **Add**.

### Step 6 — Add key to Vercel

1. Open [Vercel](https://vercel.com) → your **silentcpo** project.
2. **Settings** → **Environment Variables**.
3. **Add new**:
   - **Name:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value:** paste the **entire** contents of the JSON file (one long block is fine).
   - **Environments:** Production (and Preview if you want).
4. **Save**.
5. **Deployments** → latest production deployment → **⋯** → **Redeploy** (required so the server sees the new variable).

### Step 7 — Test in SilentCPO admin

1. **https://silentcpo.me/admin** → **Analytics** (confirm Property ID + Search Console URL saved).
2. **Content** or **Analytics** → **Show traffic & search performance** → **Refresh**.
3. You should see sessions, page views, clicks, impressions (may be low or zero on a new site).

### If something fails

| Message | Fix |
|---------|-----|
| Reporting not configured | Step 6 missing or redeploy not done |
| GA4 Data API failed | Wrong Property ID, or step 4 email not added |
| Search Console failed | Search Console URL in admin must match property exactly; step 5 |
| All zeros | Normal for new sites; wait 24–48h after traffic |

## Database

Analytics IDs are stored in `SiteSettings` (`npm run db:deploy` on deploy).
