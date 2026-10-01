import { ContentKind, profileDefaults } from "./schema";
export type Field = { key: string; label: string; type?: "textarea" | "number" | "date" | "url" | "select"; options?: string[]; help?: string };
export const labels: Record<ContentKind, string> = { profile: "Business profile", source: "Source library", topic: "Topic planner", article: "Articles", backlink: "Backlink opportunities" };
export const fields: Record<ContentKind, Field[]> = {
  profile: [
    { key: "audience", label: "Who you help", type: "textarea" },
    { key: "services", label: "Services you offer", type: "textarea" },
    { key: "positioning", label: "Your approach", type: "textarea" },
    { key: "instructions", label: "Writing rules", type: "textarea" },
    { key: "exclusions", label: "Things to avoid or keep private", type: "textarea" },
    { key: "competitors", label: "Competitor websites and notes", type: "textarea", help: "Rival agencies or studios you compete with for the same clients — not sites you built (Bookivo, Witness Wise, portfolio work, or silentcpo.me). One competitor per line: URL or domain plus how they position. The topic planner skips your portfolio URLs automatically." },
    { key: "cta", label: "Call to action" }, { key: "ctaUrl", label: "Call-to-action URL", type: "url" },
  ],
  source: [
    { key: "url", label: "Source URL (optional)", type: "url" },
    { key: "text", label: "Verified facts or document text", type: "textarea", help: "Paste selected Markdown or notes. Only approved sources are shared with n8n. Do not include passwords or private client records." },
  ],
  topic: [
    { key: "keyword", label: "Target search phrase" }, { key: "audience", label: "Who is searching?" },
    { key: "intent", label: "Article purpose", type: "select", options: ["Guide", "Comparison", "Buying decision", "Project story"] },
    { key: "rationale", label: "Why is this worth writing?", type: "textarea" },
    { key: "brief", label: "Brief and source notes", type: "textarea" },
    { key: "priority", label: "Priority (1 highest, 5 lowest)", type: "number" },
    { key: "plannedDate", label: "Planned writing date", type: "date", help: "A planning date, not an automatic publishing schedule." },
    { key: "targetUrl", label: "Related service or project URL", type: "url" },
  ],
  article: [
    { key: "excerpt", label: "Article summary", type: "textarea" },
    { key: "keyword", label: "Target search phrase" },
    { key: "metaTitle", label: "SEO title (optional)" },
    { key: "metaDescription", label: "SEO description", type: "textarea" },
    { key: "body", label: "Article body", type: "textarea", help: "Supports paragraphs, # headings, - bullet lists, and [link text](https://example.com). HTML is displayed as text, never executed." },
    { key: "sources", label: "Editorial source notes (private)", type: "textarea", help: "These notes are not published. Add reader-facing citations directly in the article body." },
  ],
  backlink: [
    { key: "url", label: "Opportunity or referring page URL", type: "url" },
    { key: "targetUrl", label: "Your page to recommend", type: "url" },
    { key: "contact", label: "Contact or submission instructions" },
    { key: "relevance", label: "Why this is relevant", type: "textarea" },
    { key: "outreach", label: "Outreach draft", type: "textarea", help: "Stored for you to review and send manually. Saving never sends a message." },
    { key: "notes", label: "Follow-up notes", type: "textarea" },
  ],
};
export function defaultData(kind: ContentKind): Record<string, string | number | string[]> {
  if (kind === "profile") return { ...profileDefaults };
  const data: Record<string, string | number | string[]> = Object.fromEntries(fields[kind].map((f) => [f.key, f.options?.[0] ?? ""]));
  if (kind === "topic") data.priority = 3;
  if (kind === "article") { data.topicId = ""; data.sourceIds = []; }
  return data;
}
