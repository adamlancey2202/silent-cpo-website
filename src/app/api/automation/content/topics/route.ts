import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { topicPlanInput } from "@/lib/content/schema";
import { apiError, json, readBody } from "@/lib/content/http";

function allowed(request: Request) {
  const expected = process.env.N8N_CONTENT_TOKEN;
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !actual) return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function norm(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  if (!allowed(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const parsed = topicPlanInput.safeParse(await readBody(request));
    if (!parsed.success) {
      return json({ error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, 400);
    }
    const v = parsed.data;
    const hash = createHash("sha256").update(JSON.stringify(v)).digest("hex");
    const previous = await db.contentTopicPlanRun.findUnique({ where: { requestKey: v.requestKey } });
    if (previous) {
      return previous.requestHash === hash
        ? json({ topicIds: previous.topicIds, created: 0, skipped: 0, replayed: true })
        : json({ error: "Request key was already used with different content." }, 409);
    }

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.contentEntry.findMany({
        where: { kind: "topic", status: { in: ["idea", "ready", "drafted"] } },
        select: { title: true, data: true },
      });
      const titles = new Set(existing.map((e) => norm(e.title)));
      const keywords = new Set(
        existing.map((e) => {
          const k = e.data && typeof e.data === "object" && "keyword" in e.data ? String((e.data as { keyword?: string }).keyword ?? "") : "";
          return norm(k);
        }).filter(Boolean),
      );

      const createdIds: string[] = [];
      let skipped = 0;
      for (const topic of v.topics) {
        const titleKey = norm(topic.title);
        const keywordKey = norm(topic.data.keyword);
        if (titles.has(titleKey) || (keywordKey && keywords.has(keywordKey))) {
          skipped += 1;
          continue;
        }
        const row = await tx.contentEntry.create({
          data: { kind: "topic", title: topic.title, status: topic.status, data: topic.data },
        });
        createdIds.push(row.id);
        titles.add(titleKey);
        if (keywordKey) keywords.add(keywordKey);
      }

      await tx.contentTopicPlanRun.create({
        data: {
          requestKey: v.requestKey,
          requestHash: hash,
          topicIds: createdIds,
          message: `Topic plan: ${createdIds.length} created, ${skipped} skipped as duplicates.`,
        },
      });
      return { topicIds: createdIds, created: createdIds.length, skipped };
    });

    return json({ ...result, replayed: false }, 201);
  } catch (error) {
    return apiError(error);
  }
}
