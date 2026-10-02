import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, readBody } from "@/lib/content/http";
import { projects } from "@/lib/projects";
import { budgetInGbp } from "@/lib/gbp";
import { draftLeadInput, freelancerBrief } from "@/lib/project-leads";

const portfolio = projects
  .map((project) => {
    const link = "url" in project && project.url ? ` (${project.url})` : "";
    return `${project.name}${link} [${project.category}] - ${project.description}`;
  })
  .join("\n");

const system = [
  "You draft a Freelancer bid for SilentCPO. The writer is a Chief Product Officer who also builds the product. He is not only a developer for hire.",
  "SilentCPO designs and builds websites, Shopify themes, booking systems, web apps, PWAs, mobile apps, membership platforms, bespoke software and AI/n8n automation.",
  "He will build this himself with an AI coding assistant, so delivery is fast. Reflect that speed in the timeline and the price.",
  "The bid must do two jobs: show he can build the thing they described, and show one product decision he will make so the first version is smaller and safer. That decision is something he takes on, not extra work or a discovery phase for the client.",
  "Pick the decision from a risk that is actually in their brief, such as rate rules, legal boundaries, payments, data access, or launch content. Never use a generic risk.",
  "Price in GBP for that scoped first version, as a single figure or a tight range, and say what it covers. A brochure site is a few hundred pounds. An interactive tool, calculator, or multi-step workflow is a web app and costs more. A web app with payments and accounts is low thousands. Never invent a client budget.",
  "Timeline is working days. State the total and what the first milestone delivers.",
  "Only cite a portfolio project when it does the same kind of work. A booking site or a personal tracker is not a match for a pay calculator. Never invent ratings, reviews, clients, results, years of experience, or URLs.",
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
    const fullBrief = await freelancerBrief(lead.url);
    const excerpt = fullBrief.length > lead.excerpt.length ? fullBrief : lead.excerpt;
    if (excerpt !== lead.excerpt) {
      await db.projectLead.update({ where: { id: lead.id }, data: { excerpt } });
    } else if (lead.url.includes("freelancer.com") && excerpt.length < 400) {
      return json({ error: "Could not load the full listing. Try Create response again." }, 502);
    }
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
              "reply is 140-190 words of plain text with line breaks, in this order:",
              "1. One opening line: you can build what they described, and you will shape the product as well as build it. Say Chief Product Officer in ordinary words, once.",
              "2. A concrete plan of 3-4 lines naming the actual features in the listing, in their words.",
              "3. One product decision for the first version, taken from their brief. Say what you will leave out or make safe, and that this is included in the first milestone. Do not ask them to solve it.",
              "4. The quote and the timeline, in one line, tied to that first version.",
              "5. One line naming a relevant portfolio project. Include its URL only when the portfolio list shows one. Never invent a URL. Skip if nothing does the same kind of work.",
              "6. One practical question that helps confirm the quote, such as existing assets or a deadline.",
              "7. A close: you can start the first milestone, and if they asked to talk the idea through, offer that conversation.",
              'Banned: "I noticed", "Have you considered", "I hope you are doing well", "Let\'s connect to explore", "perfect fit", "unclear requirements", "unclear user requirements", "defining the inputs", a discovery phase, and mentioning being new.',
              "",
              "## SilentCPO portfolio (cite only these)",
              portfolio,
              "",
              "## Listing",
              `Title: ${lead.title}`,
              `Source: ${lead.source}`,
              budget ? `Budget stated by client, in GBP: ${budget}` : "Budget: not stated",
              excerpt,
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
