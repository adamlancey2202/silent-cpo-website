# Site analytics (Google Analytics 4)

## Setup

1. Create a [GA4 property](https://analytics.google.com/) for `silentcpo.me`.
2. **Admin → Data streams → Web** → copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. In **SilentCPO Admin → Analytics**, paste the ID and click **Save analytics**.

You do **not** paste the HTML snippet from GA4 into the site — the layout injects the same **Google tag (gtag.js)** automatically using that ID.

Alternatively set server env `GA4_MEASUREMENT_ID` (used only until you save in admin, which stores the value in Postgres).

Tracking is **off** on `/admin` and on Vercel preview deployments.

## Which blog posts worked?

In GA4: **Reports → Engagement → Pages and screens**. Look for paths starting with `/blog/` to compare articles.

Allow 24–48 hours after first publish for stable numbers.

## Database

Settings live in the `SiteSettings` table (migration `20261001143000_site_settings`). Apply with `npm run db:deploy` on production.
