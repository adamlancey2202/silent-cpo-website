import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { isPreviewDeployment } from "@/lib/indexing";

import { publishedArticles } from "@/lib/content/public";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isPreviewDeployment) return [];
  // Omit lastModified until a real content-update timestamp is maintained.
  const articles = await publishedArticles();
  return [{ url: siteConfig.url }, { url: `${siteConfig.url}/privacy` }, { url: `${siteConfig.url}/blog` }, ...articles.map((article) => ({ url: `${siteConfig.url}/blog/${article.slug}`, lastModified: article.updatedAt }))];
}
