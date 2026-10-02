import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, readBody } from "@/lib/content/http";
import { sendProjectReply } from "@/lib/mailersend";
import { sendLeadInput } from "@/lib/project-leads";

export async function POST(request: Request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  try {
    const parsed = sendLeadInput.safeParse(await readBody(request));
    if (!parsed.success) {
      return json(
        { error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") },
        400
      );
    }
    const existing = await db.projectLead.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return json({ error: "Listing not found." }, 404);

    const sent = await sendProjectReply({
      to: parsed.data.email,
      title: existing.title,
      reply: parsed.data.reply,
      listingUrl: existing.url,
    });
    if (!sent.ok) return json({ error: sent.error || "Email could not be sent." }, 503);

    const lead = await db.projectLead.update({
      where: { id: existing.id },
      data: {
        status: "sent",
        contactEmail: parsed.data.email,
        reply: parsed.data.reply,
        sentAt: new Date(),
      },
    });
    return json(lead);
  } catch (error) {
    return apiError(error);
  }
}
