import { siteConfig } from "@/lib/site";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** Public HTTPS URL for the shared blog / social preview image. */
export function blogOgImageUrl(): string {
  const custom = process.env.BLOG_OG_IMAGE_URL?.trim();
  if (custom) {
    try {
      const parsed = new URL(custom);
      if (parsed.protocol === "https:") return parsed.toString();
    } catch {
      /* use fallback */
    }
  }
  return `${siteConfig.url}/images/brand-card.png`;
}

export function blogOgImageMeta() {
  return {
    url: blogOgImageUrl(),
    width: OG_WIDTH,
    height: OG_HEIGHT,
    alt: "SilentCPO — Insights",
  } as const;
}

/** Hostnames allowed for next/image when loading blog covers from R2. */
export function blogImageRemoteHostnames(): string[] {
  const hosts = new Set<string>();
  const fromOg = process.env.BLOG_OG_IMAGE_URL?.trim();
  if (fromOg) {
    try {
      hosts.add(new URL(fromOg).hostname);
    } catch {
      /* ignore */
    }
  }
  const base = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (base) {
    try {
      hosts.add(new URL(base).hostname);
    } catch {
      /* ignore */
    }
  }
  return [...hosts];
}
