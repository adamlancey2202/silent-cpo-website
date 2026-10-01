import { siteConfig } from "@/lib/site";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** Drop your file at `public/images/blog-og-default.webp` (or .png). */
export const BLOG_OG_PUBLIC_PATH = "/images/blog-og-default.webp";

/** Absolute URL for metadata; path for same-origin assets. */
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
  return `${siteConfig.url}${BLOG_OG_PUBLIC_PATH}`;
}

/** Path under `public/` for next/image (same-origin). */
export function blogOgImagePath(): string {
  if (process.env.BLOG_OG_IMAGE_URL?.trim()) return blogOgImageUrl();
  return BLOG_OG_PUBLIC_PATH;
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
