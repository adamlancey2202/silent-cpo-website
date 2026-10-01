import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

const PORTFOLIO_NAME_MARKERS = [
  "goddery",
  "bookivo",
  "aevum",
  "kratos",
  "witnesswise",
  "vialo",
  "silentcpo",
];

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function hostFromUrl(raw: string): string | null {
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return normalizeHost(new URL(withProtocol).hostname);
  } catch {
    return null;
  }
}

function portfolioHosts(): Set<string> {
  const hosts = new Set<string>();
  hosts.add(normalizeHost(new URL(siteConfig.url).hostname));
  hosts.add("silentcpo.me");
  for (const project of projects) {
    if ("url" in project && project.url) {
      const host = hostFromUrl(project.url);
      if (host) hosts.add(host);
    }
  }
  return hosts;
}

const PORTFOLIO_HOSTS = portfolioHosts();

export function extractUrlCandidates(text: string): string[] {
  const urls = new Set<string>();
  for (const match of text.matchAll(/https?:\/\/[^\s)\]>"']+/gi)) {
    urls.add(match[0].replace(/[.,;]+$/, ""));
  }
  for (const match of text.matchAll(/\b(?:www\.)?([a-z0-9][-a-z0-9]*(?:\.[a-z0-9][-a-z0-9]*)+\.[a-z]{2,})(?:\/[^\s]*)?/gi)) {
    let candidate = match[0].replace(/[.,;]+$/, "");
    if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
    urls.add(candidate);
  }
  return [...urls];
}

export function isPortfolioOrOwnSite(url: string): string | null {
  const lower = url.toLowerCase();
  const host = hostFromUrl(url);
  if (!host) return "unparseable_url";
  if (PORTFOLIO_HOSTS.has(host)) return "silentcpo_or_listed_portfolio_client_site";
  if (host.endsWith(".silentcpo.me")) return "silentcpo_subdomain";
  if (PORTFOLIO_NAME_MARKERS.some((marker) => host.includes(marker) || lower.includes(`${marker}.`))) {
    return "matches_portfolio_project_name";
  }
  if (lower.includes("silentcpo.me")) return "silentcpo_site_path";
  return null;
}

export function planCompetitorFetches(competitorNotes: string, maxFetch = 20) {
  const notes = competitorNotes.trim();
  const skipped: { url: string; reason: string }[] = [];
  const fetchUrls: string[] = [];

  for (const url of extractUrlCandidates(notes)) {
    const reason = isPortfolioOrOwnSite(url);
    if (reason) {
      skipped.push({ url, reason });
      continue;
    }
    fetchUrls.push(url);
  }

  return {
    notes,
    fetchUrls: fetchUrls.slice(0, maxFetch),
    skipped,
    competitorLines: notes.split(/\n/).map((line) => line.trim()).filter(Boolean).length,
  };
}
