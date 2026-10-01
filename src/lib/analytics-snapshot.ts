import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { google } from "googleapis";
import { getGoogleServiceAccount } from "@/lib/google-credentials";
import { getSiteSettings } from "@/lib/site-settings";

export type BlogPageMetric = {
  path: string;
  pageViews: number;
  sessions: number;
  clicks: number;
  impressions: number;
};

export type AnalyticsSnapshot = {
  rangeDays: number;
  measurementId: string;
  propertyId: string;
  gscSiteUrl: string;
  reportingConfigured: boolean;
  ga4Connected: boolean;
  searchConsoleConnected: boolean;
  totals: {
    sessions: number;
    pageViews: number;
    clicks: number;
    impressions: number;
  };
  blogPages: BlogPageMetric[];
  notice?: string;
};

function dateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function fetchAnalyticsSnapshot(rangeDays = 28): Promise<AnalyticsSnapshot> {
  const settings = await getSiteSettings();
  const propertyId = settings.ga4PropertyId.replace(/\D/g, "");
  const gscSiteUrl = settings.gscSiteUrl.trim();
  const credentials = getGoogleServiceAccount();

  const empty: AnalyticsSnapshot = {
    rangeDays,
    measurementId: settings.ga4MeasurementId,
    propertyId: settings.ga4PropertyId,
    gscSiteUrl,
    reportingConfigured: Boolean(credentials),
    ga4Connected: false,
    searchConsoleConnected: false,
    totals: { sessions: 0, pageViews: 0, clicks: 0, impressions: 0 },
    blogPages: [],
  };

  if (!credentials) {
    return {
      ...empty,
      notice:
        "To load numbers here, add a Google service account key on Vercel (see Analytics settings below). Your measurement ID only tracks visits on the public site.",
    };
  }

  const { startDate, endDate } = dateRange(rangeDays);
  const blogPaths = new Map<string, BlogPageMetric>();

  if (propertyId) {
    try {
      const client = new BetaAnalyticsDataClient({ credentials });
      const [totalsReport] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: "today" }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      });
      const totalRow = totalsReport.rows?.[0];
      if (totalRow?.metricValues) {
        empty.totals.sessions = Number(totalRow.metricValues[0]?.value ?? 0);
        empty.totals.pageViews = Number(totalRow.metricValues[1]?.value ?? 0);
      }

      const [blogReport] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "CONTAINS", value: "/blog" },
          },
        },
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 20,
      });
      for (const row of blogReport.rows ?? []) {
        const path = row.dimensionValues?.[0]?.value ?? "";
        if (!path.includes("/blog")) continue;
        blogPaths.set(path, {
          path,
          pageViews: Number(row.metricValues?.[0]?.value ?? 0),
          sessions: Number(row.metricValues?.[1]?.value ?? 0),
          clicks: 0,
          impressions: 0,
        });
      }
      empty.ga4Connected = true;
    } catch {
      empty.notice = "GA4 Data API failed. Check the numeric property ID and that the service account has Viewer access on the property.";
    }
  }

  if (gscSiteUrl) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });
      const searchconsole = google.searchconsole({ version: "v1", auth });
      const siteTotals = await searchconsole.searchanalytics.query({
        siteUrl: gscSiteUrl,
        requestBody: { startDate, endDate },
      });
      empty.totals.clicks = Number(siteTotals.data.rows?.[0]?.clicks ?? 0);
      empty.totals.impressions = Number(siteTotals.data.rows?.[0]?.impressions ?? 0);

      const byPage = await searchconsole.searchanalytics.query({
        siteUrl: gscSiteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ["page"],
          rowLimit: 25,
        },
      });
      for (const row of byPage.data.rows ?? []) {
        const path = row.keys?.[0] ?? "";
        if (!path.includes("/blog")) continue;
        const existing = blogPaths.get(path) ?? {
          path,
          pageViews: 0,
          sessions: 0,
          clicks: 0,
          impressions: 0,
        };
        existing.clicks = Number(row.clicks ?? 0);
        existing.impressions = Number(row.impressions ?? 0);
        blogPaths.set(path, existing);
      }
      empty.searchConsoleConnected = true;
    } catch {
      empty.notice =
        empty.notice ??
        "Search Console API failed. Add the service account email as a user in Search Console and check the site URL.";
    }
  }

  empty.blogPages = [...blogPaths.values()]
    .sort((a, b) => b.pageViews + b.clicks - (a.pageViews + a.clicks))
    .slice(0, 15);

  if (!propertyId && !gscSiteUrl) {
    empty.notice = "Add GA4 property ID and/or Search Console site URL in Admin → Analytics, then save.";
  }

  return empty;
}
