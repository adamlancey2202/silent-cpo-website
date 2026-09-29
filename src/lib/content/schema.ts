import { z } from "zod";

export const kinds = ["profile", "source", "topic", "article", "backlink"] as const;
export type ContentKind = typeof kinds[number];
const short = z.string().trim().max(500);
const notes = z.string().trim().max(30000);
export const safeUrl = z.string().url().max(2000).refine((v) => /^https?:\/\//i.test(v), "Use an http or https URL");
const optionalUrl = z.union([safeUrl, z.literal("")]);
export const articleData = z.object({
  excerpt: z.string().trim().max(400),
  body: z.string().trim().max(80000),
  metaTitle: z.string().trim().max(100),
  metaDescription: z.string().trim().max(200),
  keyword: short,
  sources: notes,
  topicId: z.string().max(100).default(""),
  sourceIds: z.array(z.string().max(100)).max(30).default([]),
}).strict();
const schemas = {
  profile: z.object({ audience: notes, services: notes, positioning: notes, instructions: notes, exclusions: notes, competitors: notes, cta: short, ctaUrl: optionalUrl }).strict(),
  source: z.object({ url: optionalUrl, text: notes }).strict(),
  topic: z.object({ keyword: short, audience: short, intent: z.enum(["Guide", "Comparison", "Buying decision", "Project story"]), rationale: notes, brief: notes, priority: z.coerce.number().int().min(1).max(5), plannedDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]), targetUrl: optionalUrl }).strict(),
  article: articleData,
  backlink: z.object({ url: optionalUrl, targetUrl: optionalUrl, contact: short, relevance: notes, outreach: notes, notes }).strict(),
};
export const statuses: Record<ContentKind, string[]> = {
  profile: ["private", "approved"], source: ["private", "approved", "archived"],
  topic: ["idea", "ready", "drafted", "archived"],
  article: ["draft", "review", "published", "archived"],
  backlink: ["research", "shortlisted", "contacted", "earned", "declined", "archived"],
};
export const entryInput = z.object({
  id: z.string().max(100).optional(), version: z.number().int().positive().optional(),
  kind: z.enum(kinds), title: z.string().trim().min(1).max(200), status: z.string(),
  slug: z.string().trim().max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  data: z.unknown(),
}).strict().superRefine((v, ctx) => {
  if (!statuses[v.kind].includes(v.status)) ctx.addIssue({ code: "custom", message: "Invalid status", path: ["status"] });
  if (v.id && !v.version) ctx.addIssue({ code: "custom", message: "Version required for updates", path: ["version"] });
  const result = schemas[v.kind].safeParse(v.data);
  if (!result.success) for (const issue of result.error.issues) ctx.addIssue({ ...issue, path: ["data", ...issue.path] });
  if (v.kind === "article" && v.status === "published" && result.success) {
    const article = articleData.parse(v.data);
    if (!v.slug || !article.body || !article.excerpt || !article.metaDescription) ctx.addIssue({ code: "custom", message: "Publishing requires a slug, body, excerpt and meta description" });
  }
}).transform((v) => ({ ...v, data: schemas[v.kind].parse(v.data) }));

export const draftInput = z.object({
  requestKey: z.string().trim().min(8).max(150),
  topicId: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  slug: z.string().max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  data: articleData,
}).strict();

export type Entry = { id: string; kind: ContentKind; title: string; status: string; slug: string | null; data: Record<string, string | number | string[]>; version: number; createdAt: string; updatedAt: string; publishedAt: string | null };
export const profileDefaults = {
  audience: "UK founders and small businesses needing websites, apps, booking systems, membership platforms or internal tools.",
  services: "Bespoke websites; custom Shopify themes; web apps; booking systems; membership platforms; business automation.",
  positioning: "A holistic product partner: understand the business problem, challenge assumptions, agree what is needed, then design and build. Direct contact with one specialist.",
  instructions: "British English. Practical and specific. Use verified project examples. Never invent statistics, results, prices, testimonials or sources. Explain the problem before the solution. Include a relevant next step. Write as SilentCPO; do not identify the person behind the studio.",
  exclusions: "Do not publish private client details. No public links to Goddery, Aevum or Kratos. No medical advice. Avoid duplicate articles and unsupported ranking promises.",
  competitors: "", cta: "Tell me what you want to achieve", ctaUrl: "https://www.silentcpo.me/#contact",
};
