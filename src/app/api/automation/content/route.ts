import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { planCompetitorFetches } from "@/lib/content/competitor-urls";
import { draftInput } from "@/lib/content/schema";
import { apiError, json, readBody } from "@/lib/content/http";

function allowed(request: Request) {
  const expected = process.env.N8N_CONTENT_TOKEN;
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !actual) return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function topicIdFromArticleData(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("topicId" in data)) return null;
  const id = String((data as { topicId?: string }).topicId ?? "").trim();
  return id || null;
}

export async function GET(request: Request) {
  if (!allowed(request)) return json({ error: "Unauthorized" }, 401);
  const context = new URL(request.url).searchParams.get("context") ?? "draft";
  const topicPlan = context === "topic-plan";
  try {
    const entries = await db.contentEntry.findMany({ where: { OR: [
      { kind: { in: ["profile", "source"] }, status: "approved" },
      { kind: "topic", status: "ready" }, { kind: "article", status: { in: ["draft", "review", "published"] } },
    ] }, orderBy: { createdAt: "asc" } });
    const existingTopics = await db.contentEntry.findMany({
      where: { kind: "topic", status: { in: ["idea", "ready", "drafted"] } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, data: true },
    });
    const profile = entries.find((e) => e.kind === "profile") ?? null;
    const competitorNotes =
      profile?.data && typeof profile.data === "object" && "competitors" in profile.data
        ? String((profile.data as { competitors?: string }).competitors ?? "")
        : "";
    return json({
      context: topicPlan ? "topic-plan" : "draft",
      profile,
      ...(topicPlan
        ? {}
        : { sources: entries.filter((e) => e.kind === "source") }),
      topics: entries.filter((e) => e.kind === "topic"),
      existingTopics,
      existingArticles: entries.filter((e) => e.kind === "article").map(({ id, title, slug, status }) => ({ id, title, slug, status })),
      competitorPlanning: profile?.status === "approved" ? planCompetitorFetches(competitorNotes) : null,
      ...(topicPlan
        ? {
            note: "Topic planning uses profile.data.competitors and competitorPlanning.fetchUrls only. Portfolio source library is omitted here; it is used later when writing drafts.",
          }
        : {}),
    });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  if (!allowed(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const parsed = draftInput.safeParse(await readBody(request));
    if (!parsed.success) return json({ error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, 400);
    const v = parsed.data;
    const hash = createHash("sha256").update(JSON.stringify(v)).digest("hex");
    const previous = await db.contentRun.findUnique({ where: { requestKey: v.requestKey } });
    if (previous) {
      if (previous.requestHash === hash) return json({ articleId: previous.articleId, replayed: true });
      const updated = await db.$transaction(async (tx) => {
        const article = await tx.contentEntry.findUnique({ where: { id: previous.articleId } });
        if (
          !article ||
          article.kind !== "article" ||
          !["draft", "review"].includes(article.status) ||
          topicIdFromArticleData(article.data) !== v.topicId
        ) {
          return null;
        }
        if (article.publishedAt && article.slug !== v.slug) throw new Error("LOCKED_SLUG");
        const saved = await tx.contentEntry.update({
          where: { id: article.id },
          data: {
            title: v.title,
            slug: v.slug,
            data: { ...v.data, topicId: v.topicId },
            version: { increment: 1 },
          },
        });
        await tx.contentRun.update({
          where: { requestKey: v.requestKey },
          data: { requestHash: hash, message: "Draft updated from a new automation run." },
        });
        return saved;
      });
      if (updated) return json({ articleId: updated.id, replayed: false, updated: true });
      return json({ error: "Request key was already used with different content. Use a new requestKey or edit the draft in admin." }, 409);
    }

    const article = await db.$transaction(async (tx) => {
      const topic = await tx.contentEntry.findUnique({ where: { id: v.topicId } });
      if (topic?.kind !== "topic") throw new Error("TOPIC_NOT_READY");

      const approved = await tx.contentEntry.count({ where: { id: { in: v.data.sourceIds }, kind: "source", status: "approved" } });
      if (approved !== new Set(v.data.sourceIds).size) throw new Error("SOURCE_NOT_APPROVED");

      if (topic.status === "ready") {
        const claimed = await tx.contentEntry.updateMany({
          where: { id: topic.id, version: topic.version, status: "ready" },
          data: { status: "drafted", version: { increment: 1 } },
        });
        if (!claimed.count) throw new Error("TOPIC_NOT_READY");
        const created = await tx.contentEntry.create({
          data: { kind: "article", status: "draft", title: v.title, slug: v.slug, data: { ...v.data, topicId: v.topicId } },
        });
        await tx.contentRun.create({
          data: { requestKey: v.requestKey, requestHash: hash, articleId: created.id, topicId: topic.id, message: "Draft received. Awaiting editorial review." },
        });
        return created;
      }

      if (topic.status === "drafted") {
        const drafts = await tx.contentEntry.findMany({
          where: { kind: "article", status: { in: ["draft", "review"] } },
        });
        const existing = drafts.find((a) => topicIdFromArticleData(a.data) === topic.id);
        if (!existing) throw new Error("TOPIC_NOT_READY");
        if (existing.publishedAt && existing.slug !== v.slug) throw new Error("LOCKED_SLUG");
        const saved = await tx.contentEntry.update({
          where: { id: existing.id },
          data: {
            title: v.title,
            slug: v.slug,
            data: { ...v.data, topicId: v.topicId },
            version: { increment: 1 },
          },
        });
        await tx.contentRun.create({
          data: { requestKey: v.requestKey, requestHash: hash, articleId: saved.id, topicId: topic.id, message: "Draft refreshed for an already-drafted topic." },
        });
        return saved;
      }

      throw new Error("TOPIC_NOT_READY");
    });
    return json({ articleId: article.id, replayed: false }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "LOCKED_SLUG") {
      return json({ error: "An article’s URL cannot change after its first publication." }, 400);
    }
    if (error instanceof Error && ["TOPIC_NOT_READY", "SOURCE_NOT_APPROVED"].includes(error.message)) {
      return json({ error: "The topic is no longer ready or a source is no longer approved. Refresh context before retrying." }, 409);
    }
    return apiError(error);
  }
}
