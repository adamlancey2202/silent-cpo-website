import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, readBody } from "@/lib/content/http";
import { draftLeadInput } from "@/lib/project-leads";

function bidWebhookUrl(): string | null {
  const raw = process.env.N8N_DRAFT_WEBHOOK_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    url.pathname = url.pathname.replace(/[^/]*$/, "bid-draft");
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  const webhook = bidWebhookUrl();
  if (!webhook) {
    return json(
      { error: "Draft webhook is not configured. Set N8N_DRAFT_WEBHOOK_URL on the server." },
      503
    );
  }

  try {
    const parsed = draftLeadInput.safeParse(await readBody(request));
    if (!parsed.success) {
      return json(
        { error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") },
        400
      );
    }
    const lead = await db.projectLead.findUnique({ where: { id: parsed.data.id } });
    if (!lead) return json({ error: "Listing not found." }, 404);

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        title: lead.title,
        source: lead.source,
        budget: lead.budget,
        excerpt: lead.excerpt,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const text = await response.text();
    if (!response.ok) {
      return json({ error: `The draft workflow returned ${response.status}.` }, 502);
    }

    let draft: { quote?: unknown; timeline?: unknown; reply?: unknown };
    try {
      draft = JSON.parse(text);
    } catch {
      return json(
        { error: "The bid draft workflow is not imported in n8n yet. Import infra/n8n/workflows/bid-draft.json and attach the OpenAI credential." },
        502
      );
    }
    const quote = String(draft.quote ?? "").trim().slice(0, 300);
    const timeline = String(draft.timeline ?? "").trim().slice(0, 300);
    const reply = String(draft.reply ?? "").trim().slice(0, 5000);
    if (!reply) return json({ error: "The draft came back empty. Try again." }, 502);

    const saved = await db.projectLead.update({
      where: { id: lead.id },
      data: { quote, timeline, reply },
    });
    return json(saved);
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return json({ error: "n8n did not respond in time. Render may be waking up — try again in a minute." }, 504);
    }
    return apiError(error);
  }
}
