# SilentCPO — Digital Product Studio

Landing page and admin backend for [SilentCPO](https://silentcpo.me).

## Features

- **Creative landing page** — Brand-aligned design with animations, no templates
- **SEO optimised** — Metadata, JSON-LD structured data, sitemap, robots.txt
- **AI-readable docs** — `llms.txt`, `llms-full.txt`, and `ai.txt` for AI crawlers
- **Contact form** — Enquiries stored in database
- **Admin dashboard** — `/admin` for enquiries and Stripe payments
- **Project Tool** — separate app at `../project tool` for kanbans, budgets, and workflows
- **Stripe integration** — Create payment links and send invoices to customers

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Set up database
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the site, [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

## Environment Variables

| Variable | Description |
|---|---|
| `SITE_URL` | Site URL for SEO/metadata (optional on Vercel — auto-detected) |
| `ADMIN_SECRET` | Secret key for admin dashboard access |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments/invoices |
| `DATABASE_URL` | Database connection string |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (public) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `MAILERSEND_API_KEY` | MailerSend API key for enquiry emails |
| `MAILERSEND_FROM_EMAIL` | Verified sender in MailerSend |
| `MAILERSEND_FROM_NAME` | Sender display name (optional) |
| `CONTACT_NOTIFY_EMAIL` | Where enquiries are sent (defaults to hello@silentcpo.me) |

## Viewing Enquiries

Contact form submissions are stored in a SQLite database. You have two ways to access them:

### Option 1: Admin dashboard (recommended)

1. Start the dev server: `npm run dev`
2. Visit [http://localhost:3000/admin](http://localhost:3000/admin)
3. Enter your `ADMIN_SECRET` from `.env`
4. Open the **Enquiries** tab — all submissions appear here with name, email, project type, budget, and message

### Option 2: Prisma Studio (direct database browser)

```bash
npm run db:studio
```

Opens a visual database editor at [http://localhost:5555](http://localhost:5555). Click the **Contact** table to browse, edit, or export enquiry records.

The database file lives at `prisma/dev.db` locally. On production (Vercel), use a hosted database (e.g. Vercel Postgres, Turso) and update `DATABASE_URL`.

## Admin Dashboard

Visit `/admin` and enter your `ADMIN_SECRET`. From there you can:

- View and manage contact form enquiries
- Create Stripe payment links for customers
- Send Stripe invoices via email
- **Platform** tab — third-party stack overview (Vercel, Stripe, MailerSend, Turnstile, etc.)

For project kanbans, budgets, and workflows, use the [Project Tool](../project%20tool).

## Cloudflare Turnstile Setup

1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Create a new site widget
3. Add your domain (`silentcpo.me` and `localhost` for dev)
4. Copy the **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `.env`
5. Copy the **Secret Key** → `TURNSTILE_SECRET_KEY` in `.env`
6. Restart the dev server

Without Turnstile keys configured, the contact form still works locally (verification is skipped).

## Stripe Setup

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Copy your secret key from [API keys](https://dashboard.stripe.com/apikeys)
3. Add `STRIPE_SECRET_KEY=sk_test_...` to `.env`
4. For invoices, ensure your Stripe account has invoicing enabled

## Deployment (Vercel + GitHub)

**Repo:** [github.com/adamlancey2202/silent-cpo-website](https://github.com/adamlancey2202/silent-cpo-website)

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub (`adamlancey2202`)
2. Import **silent-cpo-website**
3. Add environment variables from `.env.example` (use production values)
4. Deploy — Vercel auto-detects Next.js

**Production database:** SQLite does not work on Vercel. Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Neon](https://neon.tech), then:

- Set `DATABASE_URL` to your Postgres connection string in Vercel env vars
- Change `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`
- Run `npm run db:push` against the production database once

**Custom domain:** In Vercel project settings → Domains, add `silentcpo.me` and point DNS as instructed.

## Brand Colours

| Name | Hex | Usage |
|---|---|---|
| Midnight Ink | `#102A43` | Primary |
| Deep Blue-Black | `#081F2C` | Background/Text |
| Soft Bone | `#F2EBDD` | Light surfaces |
| Antique Gold | `#B89A62` | Accent (≤3%) |
| Mineral Green | `#6F9C8C` | Product accent |
| Mist Blue | `#DCE7ED` | Quiet surfaces |
