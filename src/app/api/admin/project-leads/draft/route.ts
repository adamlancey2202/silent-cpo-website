import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, json, readBody } from "@/lib/content/http";
import { projects } from "@/lib/projects";
import { budgetInGbp } from "@/lib/gbp";
import { draftLeadInput, freelancerBrief } from "@/lib/project-leads";

const portfolioEntries = projects.map((project) => {
    const link = "url" in project && project.url ? ` (${project.url})` : "";
    return {
      name: project.name,
      text: `${project.name}${link} [${project.category}] - ${project.description}`,
    };
  });

function relevantPortfolio(brief: string) {
  const categories: { pattern: RegExp; names: string[] }[] = [
    { pattern: /\bbooking|appointment|calendar|salon\b/i, names: ["Bookivo"] },
    { pattern: /\bshopify|storefront|e-?commerce|online store|retail\b/i, names: ["The Goddery", "Aevum Healthcare"] },
    { pattern: /\bmembership|member portal|private community|referral access\b/i, names: ["Kratos Dominion", "Aevum Healthcare"] },
    { pattern: /\blegal services|professional services|service website\b/i, names: ["Witness Wise"] },
    { pattern: /\binventory|stock count|reorder|personal tracking\b/i, names: ["Vialo"] },
    { pattern: /\bn8n|content automation|editorial|blog automation\b/i, names: ["SilentCPO Content Studio"] },
  ];
  const names = new Set(categories.filter(({ pattern }) => pattern.test(brief)).flatMap(({ names }) => names));
  const matches = portfolioEntries.filter((entry) => names.has(entry.name));
  return matches.length
    ? matches.map((entry) => entry.text).join("\n")
    : "No directly comparable portfolio project. Do not cite a portfolio item.";
}

const system = [
  "You draft a Freelancer bid for SilentCPO. The writer is a Chief Product Officer who also builds the product. He is not only a developer for hire.",
  "SilentCPO designs and builds websites, Shopify themes, booking systems, web apps, PWAs, mobile apps, membership platforms, bespoke software and AI/n8n automation.",
  "He will build this himself with an AI coding assistant, so delivery is fast. Reflect that speed in the timeline and the price.",
  "The bid must do two jobs: show he can build the thing they described, and show one product decision he will make so the first version is smaller and safer. That decision is something he takes on, not extra work or a discovery phase for the client.",
  "Pick the decision from a risk that is actually in their brief, such as rate rules, legal boundaries, payments, data access, or launch content. Never use a generic risk.",
  "Do not remove a user outcome the client presents as central to the product. Reduce scope by limiting the initial rule set, audience, data source, integration, content set, or administrative tooling instead.",
  "Every bid is written afresh from the full listing. Refer to two or more concrete details from it so the proposal cannot read like a reusable template.",
  "Be client-focused and lightly empathetic about the problem they are solving. Do not make the bid mainly about the writer.",
  "Use the client's name only when it is explicitly present. Never guess it.",
  "Price in GBP for that scoped first version, as a single figure or a tight range, and say what it covers. A brochure site is a few hundred pounds. An interactive tool, calculator, or multi-step workflow is a web app and costs more. A web app with payments and accounts is low thousands. Never invent a client budget.",
  "Price competitively against the stated budget without automatically being the cheapest. Timeline is working days. State the total and what the first milestone delivers, and never promise an unrealistic deadline.",
  "Only cite a portfolio project when its core function is directly comparable, not merely because both products have users, forms, or a good interface. A booking site, member platform, or personal tracker is not proof for a pay calculator. If no project is directly comparable, omit portfolio proof. Never invent ratings, reviews, clients, results, years of experience, or URLs.",
  "Ask one specific, open-ended question only when the answer is not already in the brief. It should make replying easy and help confirm scope.",
  "For calculators driven by laws, rates, eligibility, or external data, prioritise asking which authoritative rule set, award, jurisdiction, or data source should launch first. Do not ask the client to repeat a user journey they already described.",
  "Sound human, direct and professional, not formal or salesy. Use correct British English and proofread the result. Return JSON only.",
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
    const portfolio = relevantPortfolio(`${lead.title}\n${excerpt}`);

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
              "2. A concrete plan of 3-4 lines naming at least two actual features or constraints from the listing, in their words, and the relevant skills or stack used to deliver them. Cover every central user outcome in the brief, not just the easiest feature.",
              "3. One product decision for the first version, taken from their brief. Keep every central user outcome, but narrow the initial rules, audience, data source, integrations, content, or admin tooling where needed. Say what you will constrain or make safe and that this is included in the first milestone. Do not ask them to solve it.",
              "4. The quote and the timeline, in one line, tied to that first version.",
              "5. One line naming a relevant portfolio project. Include its URL only when the portfolio list shows one. Never invent a URL. Skip if nothing does the same kind of work.",
              "6. One open-ended, project-specific question whose answer is not already in the listing. Ask no question if the brief already contains everything needed to begin.",
              "7. A direct call to action: offer to discuss the approach in Freelancer chat and start the first milestone.",
              'Banned: "Dear sir/madam", "I noticed", "Have you considered", "I hope you are doing well", "Let\'s connect to explore", "perfect fit", "please give me a chance", "unclear requirements", "unclear user requirements", "defining the inputs", "basic" when describing the client\'s product, a discovery phase, mentioning being new, generic urgency, and asking for information already supplied.',
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
