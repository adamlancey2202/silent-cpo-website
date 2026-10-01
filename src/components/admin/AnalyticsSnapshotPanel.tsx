"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

const STORAGE_KEY = "content-studio-analytics-snapshot-hidden";

type Snapshot = {
  rangeDays: number;
  measurementId: string;
  propertyId: string;
  gscSiteUrl: string;
  reportingConfigured: boolean;
  ga4Connected: boolean;
  searchConsoleConnected: boolean;
  totals: { sessions: number; pageViews: number; clicks: number; impressions: number };
  blogPages: { path: string; pageViews: number; sessions: number; clicks: number; impressions: number }[];
  notice?: string;
};

type Props = {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  compact?: boolean;
};

function fmt(n: number) {
  return n.toLocaleString("en-GB");
}

export function AnalyticsSnapshotPanel({ apiFetch, compact = false }: Props) {
  const [hidden, setHidden] = useState(true);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/analytics/snapshot?days=28");
      const data = (await res.json()) as Snapshot & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load analytics");
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!hidden) void load();
  }, [hidden, load]);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function showAgain() {
    setHidden(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  if (hidden) {
    return (
      <p className={compact ? "text-sm text-mist/60" : "mt-2 text-sm text-mist/60"}>
        <button type="button" className="text-gold underline hover:no-underline" onClick={showAgain}>
          Show traffic &amp; search performance
        </button>
      </p>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-gold/25 bg-gradient-to-br from-midnight/80 to-deep/60 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-gold">PERFORMANCE</p>
          <h3 className="mt-1 text-lg font-medium text-bone">Blog traffic &amp; search (last 28 days)</h3>
          <p className="mt-2 max-w-2xl text-sm text-mist/70">
            Page views and sessions from Google Analytics, plus search clicks and impressions from Search Console when reporting is connected on the server.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-mist/60 underline hover:text-mist"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button type="button" className="text-sm text-mist/60 underline hover:text-mist" onClick={dismiss}>
            Hide performance
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {loading && !snapshot && <p className="mt-6 text-sm text-mist/60">Loading from Google…</p>}

      {snapshot && (
        <>
          {snapshot.notice && (
            <p className="mt-4 rounded-lg border border-mist/15 bg-deep/50 p-4 text-sm text-mist/75">{snapshot.notice}</p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Sessions", snapshot.totals.sessions, snapshot.ga4Connected],
              ["Page views", snapshot.totals.pageViews, snapshot.ga4Connected],
              ["Search clicks", snapshot.totals.clicks, snapshot.searchConsoleConnected],
              ["Impressions", snapshot.totals.impressions, snapshot.searchConsoleConnected],
            ].map(([label, value, live]) => (
              <div key={String(label)} className="rounded-xl border border-mist/15 p-4">
                <p className="text-xs text-mist/60">{label}</p>
                <p className="mt-2 text-2xl text-gold">{live ? fmt(Number(value)) : "—"}</p>
              </div>
            ))}
          </div>

          {snapshot.blogPages.length > 0 ? (
            <div className="mt-6 overflow-x-auto rounded-xl border border-mist/15">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-mist/15 text-xs text-mist/60">
                  <tr>
                    <th className="p-3 font-normal">Page</th>
                    <th className="p-3 font-normal">Views</th>
                    <th className="p-3 font-normal">Sessions</th>
                    <th className="p-3 font-normal">Clicks</th>
                    <th className="p-3 font-normal">Impressions</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.blogPages.map((row) => (
                    <tr key={row.path} className="border-t border-mist/10">
                      <td className="max-w-[14rem] truncate p-3 font-mono text-xs text-bone">{row.path}</td>
                      <td className="p-3">{row.pageViews ? fmt(row.pageViews) : "—"}</td>
                      <td className="p-3">{row.sessions ? fmt(row.sessions) : "—"}</td>
                      <td className="p-3">{row.clicks ? fmt(row.clicks) : "—"}</td>
                      <td className="p-3">{row.impressions ? fmt(row.impressions) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !loading && (
              <p className="mt-6 text-sm text-mist/60">
                No blog paths with data yet. Publish posts and check back after Google has processed traffic.
              </p>
            )
          )}

          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1 text-sm text-gold hover:underline"
          >
            Open full Google Analytics
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </>
      )}
    </div>
  );
}
