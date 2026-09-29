import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { entryInput } from "@/lib/content/schema";
import { apiError, json, readBody } from "@/lib/content/http";

export async function GET() {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const [entries, runs] = await Promise.all([
      db.contentEntry.findMany({ orderBy: { updatedAt: "desc" } }),
      db.contentRun.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, requestKey: true, articleId: true, topicId: true, message: true, createdAt: true } }),
    ]);
    return json({ entries, runs, automationConfigured: Boolean(process.env.N8N_CONTENT_TOKEN) });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const parsed = entryInput.safeParse(await readBody(request));
    if (!parsed.success) return json({ error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, 400);
    const v = parsed.data;
    // A fixed identifier makes the business profile a singleton.
    const id = v.kind === "profile" ? "studio-profile" : v.id;
    const saved = await db.$transaction(async (tx) => {
      const existing = id ? await tx.contentEntry.findUnique({ where: { id } }) : null;
      if (v.id && !existing) return null;
      if (existing && (existing.kind !== v.kind || existing.version !== v.version)) return null;
      // Keep published URLs stable; changing the title never breaks existing links.
      if (existing?.publishedAt && existing.slug !== (v.slug || null)) throw new Error("LOCKED_SLUG");
      const data = { kind: v.kind, title: v.title, status: v.status, data: v.data, slug: v.kind === "article" ? v.slug || null : null,
        publishedAt: existing?.publishedAt ?? (v.kind === "article" && v.status === "published" ? new Date() : null) };
      if (!existing) return tx.contentEntry.create({ data: { ...data, ...(id ? { id } : {}) } });
      const result = await tx.contentEntry.updateMany({ where: { id: existing.id, version: v.version }, data: { ...data, version: { increment: 1 } } });
      return result.count ? tx.contentEntry.findUnique({ where: { id: existing.id } }) : null;
    });
    if (!saved) return json({ error: "This entry changed elsewhere. Reload it before saving." }, 409);
    return json(saved);
  } catch (error) {
    if (error instanceof Error && error.message === "LOCKED_SLUG") return json({ error: "An article’s URL cannot change after its first publication." }, 400);
    return apiError(error);
  }
}
