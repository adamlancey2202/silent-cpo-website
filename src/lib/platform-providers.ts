export type PlatformCategory =
  | "Infrastructure"
  | "Automation"
  | "Payments"
  | "Messaging"
  | "Security"
  | "Analytics";

export type PlatformLink = {
  label: "Dashboard" | "Billing" | "Usage" | "Docs";
  href: string;
};

export type PlatformProvider = {
  id: string;
  name: string;
  category: PlatformCategory;
  usedFor: string;
  costHint: string;
  check: string;
  envKeys: string[];
  links: PlatformLink[];
};

export type PlatformProviderCard = PlatformProvider & {
  configured: boolean;
};

export const PLATFORM_CATEGORIES: PlatformCategory[] = [
  "Infrastructure",
  "Automation",
  "Payments",
  "Messaging",
  "Security",
  "Analytics",
];

export const PLATFORM_PROVIDERS: PlatformProvider[] = [
  {
    id: "vercel",
    name: "Vercel",
    category: "Infrastructure",
    usedFor: "Production hosting, deploys, preview URLs, and custom domains.",
    costHint: "Watch bandwidth, function invocations, and build minutes on the Hobby plan.",
    check: "Open Usage first, then Billing if anything spiked after a deploy.",
    envKeys: ["VERCEL", "VERCEL_URL"],
    links: [
      { label: "Dashboard", href: "https://vercel.com/dashboard" },
      { label: "Usage", href: "https://vercel.com/account/usage" },
      { label: "Billing", href: "https://vercel.com/account/billing" },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    category: "Infrastructure",
    usedFor: "Source repo and Vercel deploy trigger for silent-cpo-website.",
    costHint: "Free for private repos at normal volume.",
    check: "Glance at Actions and recent commits before production deploys.",
    envKeys: [],
    links: [
      {
        label: "Dashboard",
        href: "https://github.com/adamlancey2202/silent-cpo-website",
      },
      { label: "Usage", href: "https://github.com/adamlancey2202/silent-cpo-website/actions" },
      { label: "Billing", href: "https://github.com/settings/billing" },
    ],
  },
  {
    id: "neon",
    name: "Neon Postgres",
    category: "Infrastructure",
    usedFor: "Production database for enquiries, Stripe records, content studio, and admin data.",
    costHint: "Compute hours and storage. SQLite is local-only — Neon required on Vercel.",
    check: "Add via Vercel Storage → Neon. DATABASE_URL is injected automatically.",
    envKeys: ["POSTGRES_PRISMA_URL", "silencpo_POSTGRES_PRISMA_URL"],
    links: [
      { label: "Dashboard", href: "https://console.neon.tech" },
      { label: "Usage", href: "https://console.neon.tech/app/settings/billing" },
      { label: "Billing", href: "https://console.neon.tech/app/settings/billing" },
    ],
  },
  {
    id: "render",
    name: "Render",
    category: "Infrastructure",
    usedFor: "Hosts n8n (and its Postgres) for Content Studio topic planning and draft workflows.",
    costHint: "Free web tier sleeps after idle time; Postgres free tier is time-limited. Upgrade if n8n OOMs or cold starts hurt.",
    check: "Confirm the n8n service and database are green. Review outbound email limits on free tier.",
    envKeys: ["N8N_DRAFT_WEBHOOK_URL"],
    links: [
      { label: "Dashboard", href: "https://dashboard.render.com" },
      { label: "Billing", href: "https://dashboard.render.com/billing" },
      { label: "Docs", href: "https://render.com/docs" },
    ],
  },
  {
    id: "cloudflare-r2",
    name: "Cloudflare R2",
    category: "Infrastructure",
    usedFor: "Optional blog OG and media storage (alternative to public/images).",
    costHint: "Low cost at studio scale; egress to internet may apply depending on setup.",
    check: "Only needed if BLOG_OG_IMAGE_URL points at R2. See docs/R2_STORAGE.md.",
    envKeys: [
      "R2_ACCOUNT_ID",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_BASE_URL",
      "BLOG_OG_IMAGE_URL",
    ],
    links: [
      { label: "Dashboard", href: "https://dash.cloudflare.com/?to=/:account/r2" },
      { label: "Docs", href: "https://developers.cloudflare.com/r2/" },
    ],
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Automation",
    usedFor: "Content Studio topic planner, OpenAI drafts, and webhook triggers into this site.",
    costHint: "Software is self-hosted on Render; cost is mostly Render compute and OpenAI usage.",
    check: "Workflow executions and credentials live here. Pair with N8N_CONTENT_TOKEN on Vercel.",
    envKeys: ["N8N_CONTENT_TOKEN", "N8N_DRAFT_WEBHOOK_URL"],
    links: [
      { label: "Dashboard", href: "https://docs.n8n.io/hosting/" },
      { label: "Docs", href: "https://docs.n8n.io/" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "Automation",
    usedFor: "Content Studio drafts in n8n, and the admin Projects copilot.",
    costHint: "Pay per token. Set a usage limit before enabling scheduled drafts or the copilot.",
    check: "n8n keeps its own credential. The Projects copilot reads OPENAI_API_KEY on this app.",
    envKeys: ["OPENAI_API_KEY"],
    links: [
      { label: "Dashboard", href: "https://platform.openai.com/usage" },
      { label: "Billing", href: "https://platform.openai.com/settings/organization/billing" },
      { label: "Docs", href: "https://platform.openai.com/docs" },
    ],
  },
  {
    id: "cron-job",
    name: "cron-job.org",
    category: "Automation",
    usedFor: "Keep-alive pings for Render n8n and scheduled webhook hits for topic/draft workflows.",
    costHint: "Free tier is enough for a few jobs.",
    check: "Verify keep-alive (every 5–10 min) and draft/topic webhook schedules still return HTTP 200.",
    envKeys: ["N8N_DRAFT_WEBHOOK_URL"],
    links: [
      { label: "Dashboard", href: "https://console.cron-job.org/jobs" },
      { label: "Docs", href: "https://cron-job.org/en/documentation/" },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Payments",
    usedFor: "Admin payment links and invoices for client billing.",
    costHint: "Processing fees per transaction — not a flat SaaS bill.",
    check: "Balance and payouts first, then reports if revenue looks off.",
    envKeys: ["STRIPE_SECRET_KEY"],
    links: [
      { label: "Dashboard", href: "https://dashboard.stripe.com" },
      { label: "Usage", href: "https://dashboard.stripe.com/reports" },
      { label: "Billing", href: "https://dashboard.stripe.com/balance" },
    ],
  },
  {
    id: "mailersend",
    name: "MailerSend",
    category: "Messaging",
    usedFor: "Contact form notifications to hello@silentcpo.me when someone enquires.",
    costHint: "Free tier covers normal enquiry volume. Watch credits if volume spikes.",
    check: "Activity log after a test form submission. Verify sender domain in MailerSend.",
    envKeys: [
      "MAILERSEND_API_KEY",
      "MAILERSEND_FROM_EMAIL",
      "CONTACT_NOTIFY_EMAIL",
    ],
    links: [
      { label: "Dashboard", href: "https://app.mailersend.com" },
      { label: "Usage", href: "https://app.mailersend.com/activity" },
      { label: "Billing", href: "https://app.mailersend.com/billing" },
    ],
  },
  {
    id: "turnstile",
    name: "Cloudflare Turnstile",
    category: "Security",
    usedFor: "Bot protection on the public contact form.",
    costHint: "Free at normal traffic levels.",
    check: "Both site key and secret must be set. Add your Vercel domain in Cloudflare.",
    envKeys: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    links: [
      {
        label: "Dashboard",
        href: "https://dash.cloudflare.com/?to=/:account/turnstile",
      },
      { label: "Docs", href: "https://developers.cloudflare.com/turnstile/" },
    ],
  },
  {
    id: "google-analytics",
    name: "Google Analytics 4",
    category: "Analytics",
    usedFor: "Site tag plus admin performance panel (sessions and blog paths when property ID is set).",
    costHint: "Free for standard web analytics at studio traffic levels.",
    check: "Admin → Analytics: measurement ID and numeric property ID. Optional GA4_MEASUREMENT_ID env fallback.",
    envKeys: ["GA4_MEASUREMENT_ID"],
    links: [
      { label: "Dashboard", href: "https://analytics.google.com/" },
      { label: "Docs", href: "https://support.google.com/analytics/answer/9304153" },
    ],
  },
  {
    id: "google-search-console",
    name: "Google Search Console",
    category: "Analytics",
    usedFor: "Search impressions and clicks in the admin performance panel.",
    costHint: "Free.",
    check: "Admin → Analytics: exact site URL. Add the service account as a Search Console user.",
    envKeys: ["GOOGLE_SERVICE_ACCOUNT_JSON"],
    links: [
      { label: "Dashboard", href: "https://search.google.com/search-console" },
      { label: "Docs", href: "https://support.google.com/webmasters/answer/9128668" },
    ],
  },
  {
    id: "google-cloud",
    name: "Google Cloud",
    category: "Analytics",
    usedFor: "Service account project for GA4 Data API and Search Console API (admin reporting only).",
    costHint: "API reads are typically free at this volume; still check billing alerts on the project.",
    check: "Enable Analytics Data API + Search Console API. Rotate keys if JSON is ever exposed.",
    envKeys: [
      "GOOGLE_SERVICE_ACCOUNT_JSON",
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    ],
    links: [
      { label: "Dashboard", href: "https://console.cloud.google.com/" },
      { label: "Billing", href: "https://console.cloud.google.com/billing" },
      { label: "Docs", href: "https://cloud.google.com/iam/docs/service-account-overview" },
    ],
  },
  {
    id: "bing-webmaster",
    name: "Bing Webmaster Tools",
    category: "Analytics",
    usedFor: "Optional HTML verification meta tag (BING_SITE_VERIFICATION) and search indexing.",
    costHint: "Free.",
    check: "Submit sitemap after deploy. Verification token is optional in Vercel env.",
    envKeys: ["BING_SITE_VERIFICATION"],
    links: [
      { label: "Dashboard", href: "https://www.bing.com/webmasters" },
      { label: "Docs", href: "https://www.bing.com/webmasters/help" },
    ],
  },
];
