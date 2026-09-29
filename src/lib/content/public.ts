import { db } from "@/lib/db";
import { articleData } from "./schema";
export async function publishedArticles() {
  const rows = await db.contentEntry.findMany({ where: { kind: "article", status: "published", publishedAt: { not: null }, slug: { not: null } }, orderBy: { publishedAt: "desc" } });
  return rows.map((row) => ({ ...row, data: articleData.parse(row.data) }));
}
export async function publishedArticle(slug: string) {
  const row = await db.contentEntry.findUnique({ where: { slug } });
  if (!row || row.kind !== "article" || row.status !== "published" || !row.publishedAt) return null;
  return { ...row, data: articleData.parse(row.data) };
}
