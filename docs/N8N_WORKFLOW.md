# Content Studio — n8n workflow (production guide)

This document defines how to operate the **SilentCPO Content Studio** automation in n8n against `https://silentcpo.me/api/automation/content`. It complements [CONTENT_STUDIO.md](./CONTENT_STUDIO.md) (API contract) and [N8N_RENDER.md](./N8N_RENDER.md) (hosting).

## Architecture

```text
┌─────────────┐     Bearer token      ┌──────────────────────────────┐
│ n8n         │ ────────────────────► │ Next.js (Vercel)             │
│ (Render)    │   GET / POST          │ /api/automation/content      │
└─────────────┘                       │ Prisma → Neon                │
      │                               └──────────────────────────────┘
      │ OpenAI API (credentials in n8n only)
      ▼
┌─────────────┐
│ OpenAI      │
└─────────────┘
```

| Responsibility | Where it lives |
|----------------|----------------|
| Editorial approval, publish, archive | Admin UI (`/admin` → Content) |
| Workflow schedule, AI calls, retries | n8n |
| Automation auth | `N8N_CONTENT_TOKEN` on Vercel + Header Auth in n8n |
| OpenAI (or other model) keys | n8n credentials only — never on the site |

The site **never** calls n8n. n8n **pulls** context and **pushes** drafts. Publishing remains human-only in admin.

## Credentials (one-time setup)

### 1. `N8N_CONTENT_TOKEN` (Vercel)

Generate once:

```bash
openssl rand -hex 32
```

- Vercel → project → **Environment Variables** → name `N8N_CONTENT_TOKEN`, value = **hex only** (no `Bearer`).
- Redeploy production.
- Confirm: **Admin → Content → n8n & history** shows the automation token is configured.

### 2. Header Auth (n8n)

**Credentials → Header Auth**

| Field | Value |
|-------|--------|
| Name | `SilentCPO Content API` |
| Header name | `Authorization` |
| Header value | `Bearer ` + the **same** hex token as Vercel |

Attach this credential to every **HTTP Request** node that calls `/api/automation/content`.

**Do not** store this token in Code node source, sticky notes, or exported workflows shared publicly. After import, re-link credentials in the n8n UI.

## Workflow template

Templates:

| File | Use |
|------|-----|
| `infra/n8n/workflows/content-studio-draft.json` | Phase A — placeholder draft (`connectivityTest`) |
| `infra/n8n/workflows/content-studio-draft-with-openai.json` | Phase B — OpenAI-generated drafts |
| `infra/n8n/workflows/content-studio-topic-planner.json` | Competitor-aware topic queue (AutoSEO-style planning) |

Phases:

| Phase | Purpose | POST body |
|-------|---------|-----------|
| **A — Connectivity** | Prove auth, DB, and topic claim | Placeholder draft |
| **B — Generation** | OpenAI chat completion → parse → POST | Real title, slug, body from model |
| **C — Schedule** | Webhook + cron-job.org or n8n schedule | Same as B |

## Node design (why not If nodes?)

n8n **If** v2.2+ uses strict comparison types. Conditions such as “object is not empty” on `{{ $json.profile }}` often fail with *Wrong type* / *expects an object but both fields are a string* when the UI and engine disagree on types.

**Production pattern for business rules:** use **Code** nodes (or **Filter** with explicit string/number comparisons you re-test after import). Keep **HTTP Request** nodes for transport only.

Template flow:

1. **Config** — `siteBaseUrl` (production: `https://silentcpo.me`).
2. **GET content context** — Header Auth.
3. **Validate context** — profile present and approved; at least one Ready topic.
4. **Select topic** — priority, optional due date, slug rules, duplicate title guard.
5. **Prepare delivery** — builds POST JSON matching [draftInput](../src/lib/content/schema.ts).
6. **Deliver draft** — POST with body from previous node (no hand-built JSON strings).
7. *(Phase B)* **Generate draft (OpenAI)** — inserted before **Prepare delivery**; output merged into delivery shape.

## Validate context (rules)

Stop the run (throw) when:

- `profile` is null → approve business profile in admin.
- `profile.status !== 'approved'` → profile exists but is not approved.
- `topics.length === 0` → set at least one topic to **Ready**.

These are **expected** failures when editorial prep is incomplete, not infrastructure errors.

## Select topic (rules)

Default policy (implemented in template):

1. Consider only items in `topics` (API already filters to Ready).
2. Optional: keep topics whose `data.plannedDate` is empty or `<= today` (UTC date `YYYY-MM-DD`).
3. Sort by `data.priority` ascending (**1 = highest**).
4. Pick the first topic.
5. Reject if `title` matches an existing article title (case-insensitive).
6. Build `requestKey`: `topic-{topicId}-draft-v1` (bump suffix only when intentionally creating a new generation attempt).

To process a different topic, change priority/planned date in admin or mark the current topic Drafted/archived before the next run.

## POST delivery (idempotency)

| HTTP | Meaning | n8n action |
|------|---------|------------|
| 201 | New draft created | Save `articleId` in execution data |
| 200 + `replayed: true` | Same `requestKey` and payload | Success — do not regenerate |
| 400 | Schema validation | Fix payload; do not blind retry |
| 401 | Auth | Fix Vercel token / Header Auth |
| 409 | Topic not Ready, slug conflict, or requestKey reuse with different body | **GET context again**; reconcile topic status |
| 503 | DB unavailable | Retry POST with **identical** body and `requestKey`; do not re-run OpenAI |

**Critical:** Generate once, persist the delivery object, retry delivery only. Never call OpenAI again for the same `requestKey` unless you intend a new version (`draft-v2`).

Slug must match: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

## Phase B — OpenAI setup

### 1. OpenAI credential in n8n

1. [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → create a key.
2. n8n → **Credentials** → **Add credential** → **OpenAI**.
3. Paste the API key → name it **`OpenAI account`** → Save.

This is separate from **SilentCPO Content API** (site automation) and separate from the n8n **Assistant** model setting.

### 2. Import the OpenAI workflow

1. **Workflows** → **Import from file** → `content-studio-draft-with-openai.json`.
2. Open **OpenAI chat completion** → select credential **OpenAI account**.
3. Open **GET content context** and **Deliver draft** → select **SilentCPO Content API**.
4. **Config** → `openAiModel` default is `gpt-4o-mini` (change if you prefer another chat model with JSON output).

Deactivate or archive the Phase A workflow so two automations do not compete for the same Ready topic.

### 3. What the workflow does

```text
Select topic → Build OpenAI prompt → OpenAI chat completion → Parse model and build delivery → Deliver draft
```

- Prompt includes approved **profile**, **sources** (evidence only), **topic** brief, and existing titles.
- OpenAI is called with `response_format: json_object`.
- **Parse model and build delivery** validates slug, trims field lengths, checks `sourceIds` against approved sources, builds the POST body.
- **Deliver draft** POSTs to `/api/automation/content` (same idempotency rules as Phase A).

### Activate vs publish

| Action | Where | Meaning |
|--------|--------|---------|
| **Activate** workflow | n8n toggle **Active** | Required for **Webhook** / schedule triggers to run without you |
| **Manual Trigger** | n8n editor | Works even when workflow is inactive |
| **Publish** article | **Admin → Content → Articles** | Makes a draft live on `/blog` — n8n cannot do this |

Turn **Active** on only when cron-job.org (or similar) should call the webhook. Manual testing does not require activation.

### 4. Before the first OpenAI run

- Profile **Approved**, relevant sources **Approved**, one topic **Ready**.
- Billing active on your OpenAI account.
- Run **Manual Trigger** once; review the **Draft** in admin before publishing.

### 5. Regenerating a topic

The default `requestKey` is `topic-{id}-draft-v1`. After a successful POST the topic is **Drafted** (no longer Ready). To run again, create a new Ready topic or use a new key suffix (`draft-v2`) only when you intentionally want a new generation attempt.

### 6. Optional: extend your existing workflow

Instead of importing, insert three nodes after **Select topic** in your working workflow:

1. **Code** — copy **Build OpenAI prompt** from the template JSON.
2. **HTTP Request** — POST `https://api.openai.com/v1/chat/completions`, auth **OpenAI API**, body `={{ $json.openAiBody }}`.
3. **Code** — copy **Parse model and build delivery**; wire **Deliver draft** to use `={{ $json.delivery }}`.

Remove or bypass **Prepare delivery** placeholder logic when OpenAI is wired.

## Automated topic planning (competitor-driven)

Replaces manual topic entry / tools like AutoSEO for **planning only** (you still review drafts and publish).

### One-time setup (~10 minutes)

1. **Admin → Content → Business profile** → **Competitor websites and notes**  
   Paste **https://…** URLs (one per line) for agencies or studios you compete with, plus a short note on how you differ. Example:

   ```text
   https://competitor-a.co.uk — template WordPress, fixed packages
   https://competitor-b.com/blog — heavy “AI websites in 24h” messaging
   ```

2. **Approve** the profile.

3. **Deploy the site** after pulling the latest code (needs `POST /api/automation/content/topics` and DB migration `ContentTopicPlanRun`). Run `npm run db:deploy` on production Neon when ready.

### n8n workflow

Import **`content-studio-topic-planner.json`**, link **SilentCPO Content API** and **OpenAI account**, then **Manual Trigger** once.

It will:

1. GET profile, existing topics, and articles  
2. Fetch competitor URLs from the profile (public pages only)  
3. Ask OpenAI for up to **8** new topics that fill gaps vs competitors  
4. POST them as **Ready** in Content Studio (skips duplicate titles/keywords)

### Schedule (hands-off)

| Workflow | Suggested cron | Purpose |
|----------|----------------|---------|
| **Topic planner** | Weekly (e.g. Monday 06:00) | Refill Ready topics |
| **OpenAI draft** | Daily (e.g. 07:00) | Write one draft from highest-priority Ready topic |

Activate each workflow and point cron-job.org at the **webhook** URLs.

### Limits (by design)

- No fabricated search volumes or rankings.  
- Competitor pages must be **public**; no login walls or heavy anti-bot.  
- You still **publish** in admin; n8n does not go live on the blog.

---

## Competitors and “beat them” content

The approved **business profile** includes **Competitor websites and notes**. That text is sent to n8n in `profile.data.competitors` and included in the OpenAI prompt (differentiate honestly; no invented claims about rivals).

**Sensible layers (do not skip human review):**

1. **Admin (now)** — List 3–5 competitor URLs and how you differ (price model, who owns the work, speed, niche). Use topic **Intent: Comparison** when a post should contrast approaches.
2. **Source library** — When a competitor publishes something worth responding to, paste **your notes or quotes you are allowed to use** into an approved **source** (not live scraping in v1). The draft workflow only trusts approved sources.
3. **Later n8n workflow (optional)** — RSS or sitemap → HTTP Request on **public feeds** you control legally → summary into a **private source** for you to approve → existing draft workflow. Add SEO tools (Ahrefs, etc.) only when you pay for an API; the model must not fabricate search volume or rankings ([CONTENT_STUDIO.md](./CONTENT_STUDIO.md)).

Competitor monitoring is **research → approved sources → topics → n8n draft → you publish**. There is no auto-publish or auto-scrape in the site today by design.

## Triggers

| Trigger | Use |
|---------|-----|
| Manual | Development and one-off runs |
| Webhook | cron-job.org daily hit (activate workflow; use production webhook URL) |

Keep Render awake with cron GET to the n8n URL ([N8N_RENDER.md](./N8N_RENDER.md)); schedule the **webhook** separately for the draft job.

## Operational checklist

Before each production run:

- [ ] Profile **Approved**
- [ ] Sources used by the workflow **Approved**
- [ ] At least one topic **Ready**
- [ ] Vercel redeployed after token rotation
- [ ] Header Auth credential linked on GET and POST nodes
- [ ] Placeholder POST disabled when using real OpenAI output

After run:

- [ ] **Admin → Articles** — new **Draft**
- [ ] Topic moved to **Drafted**
- [ ] **n8n & history** — delivery logged
- [ ] Human review before **Published**

## Verification

Site integration tests (isolated DB only):

```bash
CONTENT_TEST_URL=http://localhost:3101 CONTENT_TEST_ADMIN=<test-secret> CONTENT_TEST_TOKEN=<test-token> node tests/content-integration.mjs
```

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Authorization failed | Token mismatch, missing Vercel redeploy, or `Bearer` only in one place |
| If node type errors | Replace with template Code nodes or re-import `content-studio-draft.json` |
| Stop — no topics | No Ready topics in admin |
| 409 on POST | Topic already drafted; refresh GET and pick another Ready topic |
| 502 on n8n URL | Render OOM or DB — see [N8N_RENDER.md](./N8N_RENDER.md) |
