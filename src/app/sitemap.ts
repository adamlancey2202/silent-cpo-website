import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { isPreviewDeployment } from "@/lib/indexing";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreviewDeployment) return [];
  // Omit lastModified until a real content-update timestamp is maintained.
  return [{ url: siteConfig.url }, { url: `${siteConfig.url}/privacy` }];
}
