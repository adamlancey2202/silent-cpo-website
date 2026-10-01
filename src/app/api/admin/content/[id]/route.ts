import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json } from "@/lib/content/http";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const { id } = await params;
    const entry = await db.contentEntry.findUnique({ where: { id } });
    if (!entry) return json({ error: "Not found" }, 404);
    if (entry.kind !== "article") {
      return json({ error: "Only articles can be deleted here. Change other entry types to Archived instead." }, 400);
    }

    await db.$transaction(async (tx) => {
      const data = entry.data && typeof entry.data === "object" ? (entry.data as Record<string, unknown>) : {};
      const topicId = typeof data.topicId === "string" ? data.topicId.trim() : "";
      if (topicId) {
        await tx.contentEntry.updateMany({
          where: { id: topicId, kind: "topic", status: "drafted" },
          data: { status: "ready", version: { increment: 1 } },
        });
      }
      await tx.contentEntry.delete({ where: { id: entry.id } });
    });

    return json({ ok: true, id, message: "Article deleted." });
  } catch (error) {
    return apiError(error);
  }
}
