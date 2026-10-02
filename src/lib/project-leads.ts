import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email");

function listingExcerpt(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 12000) : "";
}

export async function freelancerBrief(url: string): Promise<string> {
  let path = "";
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("freelancer.com")) return "";
    path = parsed.pathname.replace(/^\/projects\//, "").replace(/\/$/, "");
  } catch {
    return "";
  }
  if (!path) return "";
  const endpoint =
    "https://www.freelancer.com/api/projects/0.1/projects/?limit=1&full_description=true&seo_urls[]=" +
    encodeURIComponent(path);
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return "";
  const body = (await response.json()) as {
    result?: { projects?: { description?: string; preview_description?: string }[] };
  };
  const project = body.result?.projects?.[0];
  return String(project?.description || project?.preview_description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 12000);
}

function listingBudget(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  const match = raw.match(
    /^(?:Budget:\s*)?(\d[\d,]*(?:\.\d+)?\s*-\s*\d[\d,]*(?:\.\d+)?\s*[A-Za-z]{2,5})/i
  );
  return (match ? match[1] : raw).slice(0, 80);
}

export const projectPick = z
  .object({
    url: z
      .string()
      .trim()
      .url()
      .max(2000)
      .refine((value) => value.startsWith("https://"), "Use an https URL"),
    title: z.string().trim().min(1).max(200),
    source: z.string().trim().min(1).max(80),
    budget: z.preprocess(listingBudget, z.string().max(80)),
    excerpt: z.preprocess(listingExcerpt, z.string().max(12000)),
  })
  .strict();

export const projectBatch = z
  .object({
    picks: z.array(projectPick).max(60),
  })
  .strict();

export const draftLeadInput = z
  .object({
    id: z.string().trim().min(1).max(100),
  })
  .strict();

export const leadStatusInput = z
  .object({
    id: z.string().trim().min(1).max(100),
    status: z.enum(["new", "dismissed"]),
  })
  .strict();

export const sendLeadInput = z
  .object({
    id: z.string().trim().min(1).max(100),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email"),
    reply: z.string().trim().min(1).max(5000),
  })
  .strict();

const trackingParams = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
]);

export function canonicalLeadUrl(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("HTTPS_ONLY");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (trackingParams.has(key)) url.searchParams.delete(key);
  }
  return url.toString().replace(/\/$/, "");
}
