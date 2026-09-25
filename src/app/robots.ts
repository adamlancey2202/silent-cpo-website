import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { isPreviewDeployment } from "@/lib/indexing";

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // Covers search and AI crawlers without giving named bots broader access.
    // Crawl rules are not authentication; admin APIs still enforce access control.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
