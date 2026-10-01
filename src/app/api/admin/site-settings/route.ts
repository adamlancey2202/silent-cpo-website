import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, readBody } from "@/lib/content/http";
import { getSiteSettings, siteSettingsInput } from "@/lib/site-settings";

export async function GET() {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    return json(await getSiteSettings());
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const parsed = siteSettingsInput.safeParse(await readBody(request));
    if (!parsed.success) {
      return json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, 400);
    }
    const v = parsed.data;
    const saved = await db.$transaction(async (tx) => {
      const existing = await tx.siteSettings.findUnique({ where: { id: "default" } });
      if (!existing) {
        return tx.siteSettings.create({
          data: { id: "default", ga4MeasurementId: v.ga4MeasurementId, version: 1 },
        });
      }
      if (existing.version !== v.version) return null;
      const updated = await tx.siteSettings.updateMany({
        where: { id: "default", version: v.version },
        data: { ga4MeasurementId: v.ga4MeasurementId, version: { increment: 1 } },
      });
      if (!updated.count) return null;
      return tx.siteSettings.findUnique({ where: { id: "default" } });
    });
    if (!saved) return json({ error: "Settings changed elsewhere. Reload before saving." }, 409);
    return json({
      ga4MeasurementId: saved.ga4MeasurementId,
      version: saved.version,
      updatedAt: saved.updatedAt.toISOString(),
      source: "database" as const,
    });
  } catch (error) {
    return apiError(error);
  }
}
