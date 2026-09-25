function tryOrigin(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) || parsed.hostname.endsWith(".localhost") || parsed.hostname.endsWith(".local")) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function resolveSiteUrl(): string {
  // Server-only — not exposed to the browser (no NEXT_PUBLIC_ prefix)
  return (
    tryOrigin(process.env.SITE_URL) ??
    "https://silentcpo.me"
  );
}

export const siteConfig = {
  name: "SilentCPO",
  tagline: "Complex ideas. Quietly mastered.",
  seoTitle: "SilentCPO | Bespoke Websites, Apps & Product Development",
  description:
    "UK digital product studio helping you define what your business needs, then design and build bespoke websites, apps, booking systems and member platforms.",
  url: resolveSiteUrl(),
  contact: {
    displayName: "SilentCPO",
    title: "Digital Product Studio",
    email: "hello@silentcpo.me",
    phone: "+44 7711 274115",
    phoneDisplay: "07711 274 115",
  },
  services: [
    "Product discovery and planning",
    "Websites",
    "Custom Shopify themes",
    "Booking systems",
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
