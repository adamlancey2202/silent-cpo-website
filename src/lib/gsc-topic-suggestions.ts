export type GscQueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscTopicSuggestion = {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
  ctr: number;
  reason: string;
  suggestedTitle: string;
  suggestedKeyword: string;
};

function norm(value: string) {
  return value.trim().toLowerCase();
}

function isBrandedQuery(query: string) {
  return /\bsilent\s*cpo\b/i.test(query) || /\bsilentcpo\b/i.test(query);
}

function queryToTitle(query: string): string {
  const t = query.trim();
  if (!t) return "";
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return capped.length > 180 ? `${capped.slice(0, 177)}…` : capped;
}

function opportunityReason(row: GscQueryRow): string | null {
  const { clicks, impressions, position } = row;
  if (impressions < 3 || isBrandedQuery(row.query)) return null;

  if (clicks === 0 && impressions >= 5) {
    return "Google is showing you for this search, but nobody has clicked yet — a stronger page or title may help.";
  }
  if (impressions >= 10 && clicks / impressions < 0.03) {
    return "Low click-through for the impressions you already get — worth a dedicated article or better meta copy.";
  }
  if (position >= 8 && position <= 35 && impressions >= 5) {
    return `Average position ~${position.toFixed(0)} — close enough that a focused post could move you up.`;
  }
  if (impressions >= 20 && clicks <= 2) {
    return "High visibility with very few clicks — target this query explicitly.";
  }
  return null;
}

function score(row: GscQueryRow): number {
  const reason = opportunityReason(row);
  if (!reason) return 0;
  let s = row.impressions;
  if (row.position > 0 && row.position <= 20) s *= 1.5;
  if (row.clicks === 0) s *= 1.2;
  return s;
}

export function buildGscTopicSuggestions(
  rows: GscQueryRow[],
  existing: { titles: string[]; keywords: string[] },
  limit = 12,
): GscTopicSuggestion[] {
  const titles = new Set(existing.titles.map(norm));
  const keywords = new Set(existing.keywords.map(norm));

  const suggestions: GscTopicSuggestion[] = [];

  for (const row of rows) {
    const reason = opportunityReason(row);
    if (!reason || score(row) === 0) continue;

    const keyword = row.query.trim().slice(0, 500);
    const keywordKey = norm(keyword);
    const suggestedTitle = queryToTitle(row.query);
    const titleKey = norm(suggestedTitle);

    if (titles.has(titleKey) || (keywordKey && keywords.has(keywordKey))) continue;

    suggestions.push({
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
      ctr: row.ctr,
      reason,
      suggestedTitle,
      suggestedKeyword: keyword,
    });
  }

  suggestions.sort((a, b) => score(b) - score(a));
  return suggestions.slice(0, limit);
}
