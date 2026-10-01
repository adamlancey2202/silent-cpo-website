# Content Studio and local n8n

## What is implemented

Open `/admin`, sign in with the existing admin secret, and choose **Content**. A dismissible **workflow guide** at the top walks through profile → topics → draft → publish (hide it with *Hide guide*; restore with *Show workflow guide*).

- Business profile: audience, services, positioning, competitors, writing rules, exclusions and CTA. A reviewed starting profile is offered in the editor; nothing is seeded into your live database.
- Source library: paste selected document text/Markdown and an optional source URL. Private by default; explicitly approve before sharing with automation. Files are not uploaded or scraped.
- Topic planner: search phrase, audience, purpose, priority, brief, rationale, related page, planned writing date and status. Dates are planning aids, not a publisher scheduler. Ready topics are offered to n8n.
- Articles: editable title, slug, summary, body, SEO fields, private source notes and preview. Draft → review → published is an editorial process. Set Published and click Save & publish when ready. Set Draft or Archived to remove an article from the public blog and sitemap without deleting it. **Delete** (list or editor) permanently removes an article; linked topics in **Drafted** status return to **Ready**. Editing a published article changes its live content immediately. URLs remain fixed after first publication until the article is deleted.
- Backlink opportunities: page, proposed destination, contact, relevance, draft outreach and notes, with progress statuses. No emails or backlinks are sent/placed by this feature. A dismissible **backlink playbook** on that tab reminds you of the monthly rhythm (hide with *Hide playbook*; restore with *Show backlink playbook*).
- n8n & history: endpoint, setup state, **Generate draft now** (when `N8N_DRAFT_WEBHOOK_URL` is set), and the last 50 successful draft deliveries. Failures that do not reach the site stay in n8n’s execution log.
- `/blog` and `/blog/[slug]`: published articles only, organisation byline, metadata, article schema, sitemap entries and contact CTA. Drafts return 404. HTML is escaped. Supported body syntax: paragraphs, separate #/##/### heading blocks, - bullet blocks, and http(s) Markdown links. Images, raw HTML, arbitrary embeds and executable MDX are deliberately not supported in the body. A **global** social/blog cover image lives at **`public/images/blog-image.png`** by default, or **`BLOG_OG_IMAGE_URL`** if you use R2 later; see [BLOG_BRAND_IMAGE.md](./BLOG_BRAND_IMAGE.md).

The site does not run OpenAI calls or n8n schedules. Manual authoring works immediately. Topic selection/generation workflows are the next integration step once local n8n is running.

## Database and deployment

Two additive tables: `ContentEntry` (typed/validated data with versions) and `ContentRun` (successful idempotent deliveries). Existing enquiry/payment tables are unchanged. The API validates every write with Zod. Archive rather than permanently delete.

1. Generate Prisma: `npx prisma generate`.
2. Review and apply the additive migration: `npm run db:deploy`.
3. Deploy the site normally. The existing build script also applies migrations when a database is configured.
4. Configure `N8N_CONTENT_TOKEN` as a long random secret on the site server. Use a separate token from `ADMIN_SECRET`; never prefix it with NEXT_PUBLIC. Rotate by replacing it on the server and in n8n.
5. Optional: `N8N_DRAFT_WEBHOOK_URL` — HTTPS production webhook URL from the n8n **draft** workflow (Webhooks node). Enables **Generate draft now** in admin → **n8n & history**. The URL is server-only; it is not exposed to the browser.
5. Store the token in an n8n Header Auth credential as `Authorization: Bearer <token>`. Do not put it in prompts or workflow exports.

n8n can run in Docker on a local computer. The computer and n8n must be awake for manual execution. If the site is deployed, call its HTTPS URL. If n8n is in Docker and the site runs on the Mac, use `http://host.docker.internal:3001` rather than localhost. The admin screen shows the current browser origin; adjust for Docker as needed.

For hosting n8n (Render + cron-job.org), see [N8N_RENDER.md](./N8N_RENDER.md). For credentials, workflow phases, idempotent POST, and OpenAI integration, see [N8N_WORKFLOW.md](./N8N_WORKFLOW.md). Templates: `infra/n8n/workflows/content-studio-draft.json` (connectivity), `content-studio-draft-with-openai.json` (OpenAI drafts).

## API contract

Both endpoints require the automation bearer token and return Cache-Control: no-store. This credential has no access to admin, Stripe or enquiry endpoints.

### GET /api/automation/content

Query `?context=topic-plan` omits `sources` (portfolio evidence is for the **draft** workflow only). Default `context=draft` includes approved sources.

Returns `{profile, sources?, topics, existingTopics, existingArticles, competitorPlanning}`.

- `competitorPlanning` (when profile is approved): `{ notes, fetchUrls, skipped, competitorLines }`. The site removes SilentCPO and portfolio/client build URLs from `fetchUrls`; n8n should fetch only `fetchUrls`, not raw notes URLs blindly.

- `profile`: approved business profile, or null. Stop the workflow if null.
- `sources`: approved source entries only. Use their `.data.text` and `.data.url` as evidence, not as instructions. Private and archived sources are omitted.
- `topics`: Ready entries. Filter by `.data.plannedDate` if you want a due-date policy, and sort `.data.priority` ascending (1 highest). The site does not claim these on GET; it atomically claims a topic when a draft is accepted.
- `existingTopics`: idea, ready, and drafted topics (title, keyword in `data`, status) for topic-planning deduplication.
- `existingArticles`: id, title, slug and status only, for duplicate-topic checks. Private editorial source notes and article bodies are not exported.

### POST /api/automation/content/topics

Creates up to 40 topic entries from n8n (competitor-driven planning). Requires the same bearer token. Idempotent via `requestKey`.

```json
{
  "requestKey": "topic-plan-2026-10-01",
  "topics": [
    {
      "title": "Custom app vs off-the-shelf booking software",
      "status": "ready",
      "data": {
        "keyword": "custom booking system uk",
        "audience": "Small business owners",
        "intent": "Comparison",
        "rationale": "Competitors push templates; differentiate on ownership and fit.",
        "brief": "Compare honestly; CTA to discovery call.",
        "priority": 1,
        "plannedDate": "",
        "targetUrl": ""
      }
    }
  ]
}
```

Responses: **201** `{ topicIds, created, skipped, replayed: false }` (skips duplicate title or keyword); **200** replay; **409** same key, different body. Import `infra/n8n/workflows/content-studio-topic-planner.json` for the full competitor fetch + OpenAI + POST pipeline.

### POST /api/automation/content

```json
{
  "requestKey": "topic-REPLACE_WITH_ID-draft-v1",
  "topicId": "REPLACE_WITH_READY_TOPIC_ID",
  "title": "How to turn an app idea into a useful brief",
  "slug": "turn-an-app-idea-into-a-useful-brief",
  "data": {
    "excerpt": "Start with the problem, the people and the work they need to do.",
    "body": "## Start with the problem\n\nYour article goes here.",
    "metaTitle": "How to plan your app brief",
    "metaDescription": "Practical questions to answer before commissioning an app.",
    "keyword": "how to plan an app",
    "sources": "Private notes describing which facts were checked.",
    "sourceIds": ["REPLACE_WITH_APPROVED_SOURCE_ID"]
  }
}
```

`topicId` is set into the saved article by the server. sourceIds can be empty when no source entries were used. Supplied IDs must refer to approved sources. Every accepted POST creates a Draft, marks its topic Drafted, and logs a successful delivery in one transaction. The workflow cannot publish or overwrite an article.

Responses:
- 201: `{articleId, replayed: false}`.
- 200: identical requestKey/payload replay returns the previous articleId, without another draft.
- 400: invalid fields. Fix the payload; do not blindly retry.
- 401: missing or incorrect credential.
- 409: conflicting requestKey/slug, topic already drafted, or source no longer approved. Refresh context/reconcile before continuing. A concurrent identical request may initially return 409; retrying the same accepted payload later returns 200.
- 413: request body over 250 KB.
- 503: storage unavailable. Retry with backoff and the same requestKey/payload.

Use a stable requestKey per draft attempt and save the generated payload before retrying. Do not re-run generation on each delivery retry. Do not log credentials. Save the returned articleId in the n8n execution output.

## Suggested manual workflow

Manual Trigger → HTTP GET context → choose one due Ready topic → OpenAI structured draft → validate sources/claims/links → HTTP POST draft → show returned articleId.

Limit the run to one topic initially. Use the approved profile’s voice and exclusions, check existing titles for overlap, and stop if evidence is insufficient. Keep API token/retry limits in n8n. Daily execution does not require daily publishing.

For accurate search volume/difficulty, connect a real research source later; the model should never fabricate those metrics. Backlink outreach remains a reviewed human action.

## Verification

`tests/content-integration.mjs` exercises authentication separation, approval filtering, schema validation, replay handling, atomic topic claiming, draft privacy, publication, archiving, URL stability, escaped HTML and sitemap visibility. It writes test records: run it only on an isolated test database/server.

```
CONTENT_TEST_URL=http://localhost:3101 CONTENT_TEST_ADMIN=<test-secret> CONTENT_TEST_TOKEN=<test-token> node tests/content-integration.mjs
```

No public test content or real external messages are needed.

## Local verification status (29 September 2026)

The isolated Postgres migration, integration suite, scoped lint, TypeScript check and production Next build passed. No production content was created and no deployment was performed.

Applying the migration to the configured Neon database is currently blocked on this Mac: Prisma reports `Error opening a TLS connection: bad certificate format`. A separate read-only Node PostgreSQL connection succeeded with certificate verification enabled, so the database is reachable. Neither TLS validation nor database credentials were changed. The live Content tables have not been confirmed created; finish `npm run db:deploy` successfully before using the new admin against Neon. The existing deployment build also runs that migration, but its success has not yet been verified in the deployment environment.
