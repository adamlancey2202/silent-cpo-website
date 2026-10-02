import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, readBody } from "@/lib/content/http";
import { projects } from "@/lib/projects";
import { budgetInGbp } from "@/lib/gbp";
import { draftLeadInput } from "@/lib/project-leads";

const portfolio = projects
  .map((project) => {
    const link = "url" in project && project.url ? ` (${project.url})` : "";
    return `${project.name}${link} [${project.category}] - ${project.description}`;
  })
  .join("\n");

const system = [
  "You draft a Freelancer bid for SilentCPO, a UK product studio run by a Chief Product Officer who also builds.",
  "SilentCPO designs and builds websites, Shopify themes, booking systems, web apps, PWAs, mobile apps, membership platforms, bespoke software and AI/n8n automation.",
  "The bid is written by a person who will build the project himself with an AI coding assistant, so delivery is fast. Reflect that speed in the timeline and the price.",
  "Price in GBP for the work described, as a single figure or a tight range, and say what it covers. Keep it competitive for a fast solo build: a simple site is a few hundred pounds, a web app with payments and accounts is low thousands, and only genuinely large builds go higher. Never invent a client budget.",
  "Timeline is working days. State the total and what the first milestone delivers.",
  "The CPO edge shows as foresight, not questions: name the one thing that usually derails this kind of project and say it is handled in the first milestone.",
  "Only cite portfolio work from the list given, and only when it is genuinely relevant. Never invent ratings, reviews, clients, results or years of experience.",
  "British English. Return JSON only.",
].join(" ");

export async function POST(request: Request) {
  if (!(await requireAdmin())) return json({ error: "Unauthorized" }, 401);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return json({ error: "Add OPENAI_API_KEY on the server to draft replies." }, 503);

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
    const budget = await budgetInGbp(lead.budget);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              'Return JSON: { "quote": "£X-£Y, covering ...", "timeline": "N working days. First milestone: ...", "reply": "..." }.',
              "reply is 120-180 words of plain text with line breaks, in this order:",
              "1. One opening line restating what they want and saying plainly that you can build it.",
              "2. A concrete plan of 3-4 lines: what you build first, what follows, and the stack only where it matters to them.",
              "3. One sentence naming the thing that usually derails this type of project and how the first milestone handles it. State it as something you take care of.",
              "4. The quote and the timeline, in one line.",
              "5. One line naming a relevant portfolio project. Include its URL only when the portfolio list shows one. Never invent a URL. Skip if nothing fits.",
              "6. One or two practical questions that help confirm the quote, such as existing assets, integrations or a deadline.",
              "7. A close offering to start on the first milestone.",
              'Banned: "I noticed", "Have you considered", "I hope you are doing well", "Let\'s connect to explore", "perfect fit", unsolicited "discovery phase" pitches, and mentioning being new.',
              "",
              "## SilentCPO portfolio (cite only these)",
              portfolio,
              "",
              "## Listing",
              `Title: ${lead.title}`,
              `Source: ${lead.source}`,
              budget ? `Budget stated by client, in GBP: ${budget}` : "Budget: not stated",
              lead.excerpt,
            ].join("\n"),
          },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      return json({ error: `OpenAI request failed (${response.status}).` }, 502);
    }
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    let draft: { quote?: unknown; timeline?: unknown; reply?: unknown };
    try {
      draft = JSON.parse(payload.choices?.[0]?.message?.content ?? "");
    } catch {
      return json({ error: "The draft came back in an unexpected format. Try again." }, 502);
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
      return json({ error: "OpenAI did not respond in time. Try again." }, 504);
    }
    return apiError(error);
  }
}
