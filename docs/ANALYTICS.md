# Site analytics (Google Analytics 4)

## Setup

1. Create a [GA4 property](https://analytics.google.com/) for `silentcpo.me`.
2. **Admin → Data streams → Web** → copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. In **SilentCPO Admin → Analytics**, paste the ID and click **Save analytics**.

You do **not** paste the HTML snippet from GA4 into the site — the layout injects the same **Google tag (gtag.js)** automatically using that ID.

Alternatively set server env `GA4_MEASUREMENT_ID` (used only until you save in admin, which stores the value in Postgres).

Tracking is **off** on `/admin` and on Vercel preview deployments.

## Performance panel in admin (Content & Analytics tabs)

Click **Show traffic & search performance** (same show/hide pattern as the workflow guide). It loads:

- **GA4:** sessions and page views (site-wide and `/blog` paths)
- **Search Console:** clicks and impressions (site-wide and blog URLs)

### One-time API setup (server)

1. [Google Cloud](https://console.cloud.google.com/) → create a project → enable **Google Analytics Data API** and **Google Search Console API**.
2. Create a **service account** → download JSON key.
3. **GA4:** Admin → Property access management → add the service account email as **Viewer**.
4. **Search Console:** Settings → Users → add the same email (Full or Restricted).
5. **Vercel** → Environment variable `GOOGLE_SERVICE_ACCOUNT_JSON` = paste the entire JSON file (single line is fine).

In **Admin → Analytics**, also save:

| Field | Example |
|-------|---------|
| Measurement ID | `G-RX4Y4D63VP` |
| Property ID (numeric) | from GA4 Admin → Property settings |
| Search Console site URL | `https://www.silentcpo.me/` |

Then open **Show traffic & search performance** on the Content tab.

## Database

Settings live in `SiteSettings`. Apply migrations with `npm run db:deploy` on production.
