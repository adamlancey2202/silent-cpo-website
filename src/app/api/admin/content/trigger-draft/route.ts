import { requireAdmin } from "@/lib/auth";
import { apiError, json } from "@/lib/content/http";

function draftWebhookUrl(): string | null {
  const raw = process.env.N8N_DRAFT_WEBHOOK_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST() {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  const webhook = draftWebhookUrl();
  if (!webhook) {
    return json(
      { error: "Draft webhook is not configured. Set N8N_DRAFT_WEBHOOK_URL on the server (HTTPS URL from your n8n Webhook node)." },
      503,
    );
  }
  if (!process.env.N8N_CONTENT_TOKEN) {
    return json({ error: "N8N_CONTENT_TOKEN is not configured. The draft workflow cannot authenticate to this site." }, 503);
  }
  try {
    const res = await fetch(webhook, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(45_000),
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* plain text response */
    }
    if (!res.ok) {
      return json({ error: `n8n webhook returned ${res.status}`, detail: body }, 502);
    }
    return json({
      ok: true,
      message: "Draft workflow started. A new draft usually appears within a few minutes — refresh and check Articles.",
      n8n: body,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return json({ error: "n8n did not respond in time. Render may be waking up — try again in a minute." }, 504);
    }
    return apiError(error);
  }
}
