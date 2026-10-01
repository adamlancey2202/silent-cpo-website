import { requireAdmin } from "@/lib/auth";
import { fetchAnalyticsSnapshot } from "@/lib/analytics-snapshot";
import { apiError, json } from "@/lib/content/http";

export async function GET(request: Request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const days = Number(new URL(request.url).searchParams.get("days") ?? "28");
    const rangeDays = Number.isFinite(days) && days > 0 && days <= 90 ? Math.floor(days) : 28;
    return json(await fetchAnalyticsSnapshot(rangeDays));
  } catch (error) {
    return apiError(error);
  }
}
