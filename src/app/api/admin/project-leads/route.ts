import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, readBody } from "@/lib/content/http";
import { isMailerSendConfigured } from "@/lib/mailersend";
import { leadStatusInput } from "@/lib/project-leads";

export async function GET() {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const [leads, newCount] = await Promise.all([
      db.projectLead.findMany({
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        take: 100,
      }),
      db.projectLead.count({ where: { status: "new" } }),
    ]);
    return json({
      leads,
      mailersendConfigured: isMailerSendConfigured(),
      newCount,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const parsed = leadStatusInput.safeParse(await readBody(request));
    if (!parsed.success) {
      return json(
        { error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") },
        400
      );
    }
    const existing = await db.projectLead.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return json({ error: "Listing not found." }, 404);
    if (existing.status === "sent" && parsed.data.status === "dismissed") {
      return json({ error: "A sent reply stays in Sent." }, 400);
    }
    const lead = await db.projectLead.update({
      where: { id: existing.id },
      data: { status: parsed.data.status, ...(parsed.data.status === "new" ? { sentAt: null } : {}) },
    });
    return json(lead);
  } catch (error) {
    return apiError(error);
  }
}
