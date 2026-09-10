function tryOrigin(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function resolveSiteUrl(): string {
  // Server-only — not exposed to the browser (no NEXT_PUBLIC_ prefix)
  return (
    tryOrigin(process.env.SITE_URL) ??
    tryOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    tryOrigin(process.env.VERCEL_URL) ??
    "https://silentcpo.me"
  );
}

export const siteConfig = {
  name: "SilentCPO",
  tagline: "Complex ideas. Quietly mastered.",
  description:
    "SilentCPO is a digital product studio building websites, web apps, PWAs, native mobile apps, membership platforms, and bespoke digital tools. Your idea, made real.",
  url: resolveSiteUrl(),
  contact: {
    displayName: "SilentCPO",
    title: "Digital Product Studio",
    email: "hello@silentcpo.me",
    phone: "+44 7711 274115",
    phoneDisplay: "07711 274 115",
  },
  services: [
    "Websites",
    "Web Apps",
    "PWAs",
    "Native Apps",
    "Membership Platforms",
    "Calculators & Tools",
    "Bespoke Software",
  ],
  keywords: [
    "digital product studio",
    "web app developer UK",
    "mobile app developer",
    "PWA developer",
    "membership platform builder",
    "SilentCPO",
    "bespoke software development",
    "Next.js developer",
    "React Native developer",
  ],
} as const;
