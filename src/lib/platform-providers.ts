export type PlatformCategory =
  | "Infrastructure"
  | "Payments"
  | "Messaging"
  | "Security";

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
  "Payments",
  "Messaging",
  "Security",
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
    usedFor: "Production database for enquiries, Stripe records, and admin data.",
    costHint: "Compute hours and storage. SQLite is local-only — Neon required on Vercel.",
    check: "Confirm production DATABASE_URL points at Neon, not file:./dev.db.",
    envKeys: ["DATABASE_URL"],
    links: [
      { label: "Dashboard", href: "https://console.neon.tech" },
      { label: "Usage", href: "https://console.neon.tech/app/settings/billing" },
      { label: "Billing", href: "https://console.neon.tech/app/settings/billing" },
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
];
