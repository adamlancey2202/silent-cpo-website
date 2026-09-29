import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { draftInput } from "@/lib/content/schema";
import { apiError, json, readBody } from "@/lib/content/http";

function allowed(request: Request) {
  const expected = process.env.N8N_CONTENT_TOKEN;
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !actual) return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function GET(request: Request) {
  if (!allowed(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const entries = await db.contentEntry.findMany({ where: { OR: [
      { kind: { in: ["profile", "source"] }, status: "approved" },
      { kind: "topic", status: "ready" }, { kind: "article", status: { in: ["draft", "review", "published"] } },
    ] }, orderBy: { createdAt: "asc" } });
    return json({
      profile: entries.find((e) => e.kind === "profile") ?? null,
      sources: entries.filter((e) => e.kind === "source"),
      topics: entries.filter((e) => e.kind === "topic"),
      existingArticles: entries.filter((e) => e.kind === "article").map(({ id, title, slug, status }) => ({ id, title, slug, status })),
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
    if (previous) return previous.requestHash === hash ? json({ articleId: previous.articleId, replayed: true }) : json({ error: "Request key was already used with different content." }, 409);
    const article = await db.$transaction(async (tx) => {
      const topic = await tx.contentEntry.findUnique({ where: { id: v.topicId } });
      if (topic?.kind !== "topic" || topic.status !== "ready") throw new Error("TOPIC_NOT_READY");
      const approved = await tx.contentEntry.count({ where: { id: { in: v.data.sourceIds }, kind: "source", status: "approved" } });
      if (approved !== new Set(v.data.sourceIds).size) throw new Error("SOURCE_NOT_APPROVED");
      const claimed = await tx.contentEntry.updateMany({ where: { id: topic.id, version: topic.version, status: "ready" }, data: { status: "drafted", version: { increment: 1 } } });
      if (!claimed.count) throw new Error("TOPIC_NOT_READY");
      const created = await tx.contentEntry.create({ data: { kind: "article", status: "draft", title: v.title, slug: v.slug, data: { ...v.data, topicId: v.topicId } } });
      await tx.contentRun.create({ data: { requestKey: v.requestKey, requestHash: hash, articleId: created.id, topicId: topic.id, message: "Draft received. Awaiting editorial review." } });
      return created;
    });
    return json({ articleId: article.id, replayed: false }, 201);
  } catch (error) {
    if (error instanceof Error && ["TOPIC_NOT_READY", "SOURCE_NOT_APPROVED"].includes(error.message)) return json({ error: "The topic is no longer ready or a source is no longer approved. Refresh context before retrying." }, 409);
    return apiError(error);
  }
}
