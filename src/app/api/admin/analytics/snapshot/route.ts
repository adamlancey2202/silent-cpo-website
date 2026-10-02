import { requireAdmin } from "@/lib/auth";
import { fetchAnalyticsSnapshot } from "@/lib/analytics-snapshot";
import { apiError, json } from "@/lib/content/http";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const days = Number(new URL(request.url).searchParams.get("days") ?? "28");
    const rangeDays = Number.isFinite(days) && days > 0 && days <= 90 ? Math.floor(days) : 28;
    const topics = await db.contentEntry.findMany({
      where: { kind: "topic", status: { in: ["idea", "ready", "drafted"] } },
      select: { title: true, data: true },
    });
    const existingTopicTitles = topics.map((t) => t.title);
    const existingTopicKeywords = topics.map((t) => {
      const data = t.data as { keyword?: string } | null;
      return String(data?.keyword ?? "");
    });
    return json(
      await fetchAnalyticsSnapshot(rangeDays, {
        existingTopicTitles,
        existingTopicKeywords,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
