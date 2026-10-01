# Host n8n on Render (cheap) and connect to Content Studio

This site’s Content Studio exposes **`/api/automation/content`** for n8n only (see [CONTENT_STUDIO.md](./CONTENT_STUDIO.md)). Your site stays on Vercel; n8n runs separately on Render.

## Is Render + cron-job.org a good cheap option?

| Piece | Cost | Role |
|--------|------|------|
| [Render](https://render.com) free web service | $0 | Runs `n8nio/n8n` Docker image |
| Render free Postgres (one per workspace) | $0 for ~30 days | Stores workflows and credentials |
| [cron-job.org](https://cron-job.org) | $0 | Pings n8n so the free web service does not sleep |

**Tradeoffs you should accept on free Render:**

- After **15 minutes** without traffic, the n8n service **spins down** (~1 minute cold start on next request).
- **750 instance-hours/month** per workspace (one always-on free service uses the whole budget).
- Free Postgres **expires after 30 days** unless you upgrade or migrate.
- Not ideal for hard SLAs; fine for a personal “morning draft” workflow.

**cron-job.org does two jobs:**

1. **Keep-alive** — GET your n8n URL every **5–10 minutes** (HTTP 200 on `/` or login page is enough).
2. **Optional schedule** — instead of n8n’s Schedule trigger alone, call a **Webhook** URL on a cron (reliable even if you skip keep-alive and accept cold starts).

For Content Studio, either **Manual Trigger** while testing or **Webhook + cron-job.org** for a daily run is enough.

---

## Part A — Deploy n8n on Render

### Option 1 — Blueprint from this repo (recommended)

1. Push this repo to GitHub if it is not already there.
2. Render → **New → Blueprint**.
3. Connect the repo. If Render asks for a root path, use **`infra/n8n`** (where `render.yaml` lives).
4. **Deploy Blueprint**. Wait until **silentcpo-n8n** and **silentcpo-n8n-db** show green.
5. Open the web service and copy the **`*.onrender.com`** URL.

**Workspace limit:** only one free Postgres per Render workspace. Delete an old free DB or use a paid plan if the sync fails.

### Option 2 — Official template

Use [render-examples/n8n](https://github.com/render-examples/n8n) (“Use this template”) — same idea, different service names.

### Required env vars (after first deploy)

In **silentcpo-n8n → Environment**, add (replace host with yours):

| Key | Example value |
|-----|----------------|
| `WEBHOOK_URL` | `https://silentcpo-n8n-xxxx.onrender.com/` |
| `N8N_HOST` | `silentcpo-n8n-xxxx.onrender.com` |
| `N8N_PROTOCOL` | `https` |
| `N8N_PROXY_HOPS` | `1` |

Save → **Manual Deploy**. Webhook nodes should now show the public URL.

### First login

1. Visit your n8n URL, create the owner account.
2. If n8n asks for a license, use the free community activation in **Settings**.

---

## Part B — cron-job.org

1. Sign up at [console.cron-job.org](https://console.cron-job.org/).
2. **Create cronjob**:
   - **Title:** `n8n keep-alive`
   - **URL:** `https://YOUR-SERVICE.onrender.com/`
   - **Schedule:** every **5** or **10** minutes
   - **Request method:** GET
3. **Test run** → expect **200** (may be slow once while the service wakes).
4. For a **daily Content Studio run**, add a second job later that calls your n8n **Webhook** URL (from the imported workflow), e.g. `https://YOUR-SERVICE.onrender.com/webhook/content-studio-draft` at `0 7 * * *` (7:00 UTC).

---

## Part C — Link to silentcpo.me (Content Studio)

### 1. Site token (Vercel)

On the **Vercel** project for this site:

```bash
openssl rand -hex 32
```

Add env var **`N8N_CONTENT_TOKEN`** = that value. Redeploy the site.

Use a **different** secret from `ADMIN_SECRET`. Never prefix with `NEXT_PUBLIC_`.

Confirm in admin: **Content → n8n & history** should show “Automation token is configured”.

### 2. n8n credential

In n8n: **Credentials → Add → Header Auth**

- **Name:** `SilentCPO Content API`
- **Header name:** `Authorization`
- **Header value:** `Bearer YOUR_N8N_CONTENT_TOKEN`

### 3. Import starter workflow

1. n8n → **Workflows → Import from file**
2. Choose [`../infra/n8n/workflows/content-studio-draft-stub.json`](../infra/n8n/workflows/content-studio-draft-stub.json)
3. Open each **HTTP Request** node and set the credential to **SilentCPO Content API**.
4. In **Set site base URL**, set `siteBaseUrl` to `https://silentcpo.me` (or your preview URL while testing).
5. **Activate** the workflow if you use the Webhook trigger; copy the **Production URL** for cron-job.org.

The stub workflow:

- **GET** context (profile, sources, ready topics, existing titles)
- Picks the first ready topic (you should add filtering by `plannedDate` / `priority` before OpenAI)
- **POST** is a placeholder — replace the **Build draft payload** node with your OpenAI step using approved profile + sources only

Full API shapes and error codes: [CONTENT_STUDIO.md](./CONTENT_STUDIO.md).

### 4. OpenAI (or other model)

Keep provider keys in **n8n credentials**, not on the Next.js site. Rate-limit and cap tokens in the workflow.

### 5. End-to-end test (manual)

1. Admin → Content: approve **business profile**, at least one **source**, one **topic** → **Ready**.
2. n8n: run workflow with **Manual Trigger** (or hit the webhook once).
3. Admin → **Articles**: new **Draft**; topic moves to **Drafted**.
4. **n8n & history** shows the delivery.

---

## Troubleshooting 502 / crash loop

If logs show **`Database connection timed out`** and **`JavaScript heap out of memory`**:

1. **Do not use `n8nio/n8n:latest` on the free web plan.** Current 2.x builds need more RAM than ~512 MB. In Render → **n8n-service** → **Settings**, set **Image URL** to `docker.io/n8nio/n8n:1.76.4` (or redeploy a blueprint that pins that tag).
2. **Set `PORT=5678` before the first deploy** so Render stops “detected new port → restart” loops.
3. **Confirm `n8n-db` is Available** (green) and in the **same region** as the web service.
4. Add environment variables on the web service, then **Manual Deploy**:

| Key | Value |
|-----|--------|
| `PORT` | `5678` |
| `NODE_OPTIONS` | `--max-old-space-size=384` |
| `DB_POSTGRESDB_CONNECTION_TIMEOUT` | `120000` |
| `DB_POSTGRESDB_POOL_SIZE` | `1` |

5. If it still OOMs after a stable DB connection, upgrade the web service to **`1c-2g`** (~$7/mo). Render’s own n8n guide recommends paid compute for anything beyond a quick test.

---

## Part D — Costs and when to upgrade

| When | Action |
|------|--------|
| Before day 30 on free Postgres | Upgrade DB to smallest paid plan **or** export workflows and migrate |
| Slow runs / OOM | Move web service from `free` to `1c-2g` in `render.yaml` |
| Need SMTP from n8n | Free Render blocks outbound 25/465/587 — use an HTTP email API node instead |
| Production content on Neon | Finish `npm run db:deploy` on production DB (see CONTENT_STUDIO.md) |

---

## Quick reference

| What | URL |
|------|-----|
| Production site | `https://silentcpo.me` |
| Automation GET/POST | `https://silentcpo.me/api/automation/content` |
| Admin UI | `https://silentcpo.me/admin` → Content |
| n8n | `https://YOUR-SERVICE.onrender.com` |

---

## Local n8n (optional)

Docker on your Mac still works for development: site in Docker calls `http://host.docker.internal:3001` instead of `localhost`. Render-hosted n8n always calls **`https://silentcpo.me`**.
