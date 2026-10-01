"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { AnalyticsSnapshotPanel } from "@/components/admin/AnalyticsSnapshotPanel";

type Settings = {
  ga4MeasurementId: string;
  ga4PropertyId: string;
  gscSiteUrl: string;
  version: number;
  updatedAt: string | null;
  source: "database" | "environment" | "none";
  reportingConfigured: boolean;
};

type Props = {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
};

const input =
  "w-full max-w-md rounded-lg border border-mist/20 bg-deep px-3 py-2 font-mono text-sm text-bone outline-none focus:border-gold";
const button =
  "rounded-lg border border-mist/20 px-4 py-2 text-sm hover:border-gold disabled:opacity-50";

export function AnalyticsPanel({ apiFetch }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [ga4, setGa4] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/site-settings");
      const data = (await res.json()) as Settings & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load settings");
      setSettings(data);
      setGa4(data.ga4MeasurementId);
      setPropertyId(data.ga4PropertyId);
      setGscSiteUrl(data.gscSiteUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load settings");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!settings || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await apiFetch("/api/admin/site-settings", {
        method: "PUT",
        body: JSON.stringify({
          version: settings.version,
          ga4MeasurementId: ga4.trim(),
          ga4PropertyId: propertyId.trim(),
          gscSiteUrl: gscSiteUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSettings(data);
      setGa4(data.ga4MeasurementId);
      setPropertyId(data.ga4PropertyId);
      setGscSiteUrl(data.gscSiteUrl);
      setNotice("Analytics settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const trackingActive = Boolean(ga4.trim());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg tracking-wider text-bone">
          <BarChart3 className="h-5 w-5 text-gold" />
          ANALYTICS
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-mist/60">
          Measurement ID powers tracking on the site. Property ID and Search Console URL power the performance panel (with a Google service account on the server).
        </p>
      </div>

      <AnalyticsSnapshotPanel apiFetch={apiFetch} />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {notice && <p className="text-sm text-green">{notice}</p>}

      {loading ? (
        <p className="text-sm text-mist/60">Loading…</p>
      ) : (
        <form onSubmit={save} className="max-w-xl space-y-5 rounded-xl border border-mist/10 bg-midnight/20 p-6">
          <label className="block space-y-2 text-sm">
            <span>GA4 measurement ID</span>
            <input
              className={input}
              placeholder="G-XXXXXXXXXX"
              value={ga4}
              onChange={(e) => setGa4(e.target.value)}
              autoComplete="off"
            />
            <span className="block text-xs text-mist/50">Data stream → Measurement ID (tracking tag).</span>
          </label>

          <label className="block space-y-2 text-sm">
            <span>GA4 property ID (numeric)</span>
            <input
              className={input}
              placeholder="123456789"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
            />
            <span className="block text-xs text-mist/50">Admin → Property settings → Property ID (numbers only).</span>
          </label>

          <label className="block space-y-2 text-sm">
            <span>Search Console site URL</span>
            <input
              className={input}
              placeholder="https://www.silentcpo.me/"
              value={gscSiteUrl}
              onChange={(e) => setGscSiteUrl(e.target.value)}
              autoComplete="off"
            />
            <span className="block text-xs text-mist/50">Exact URL as in Search Console (for clicks &amp; impressions).</span>
          </label>

          <p className="text-xs leading-relaxed text-mist/50">
            The performance panel needs a one-time Google <strong className="font-normal text-mist/70">service account</strong> on Vercel: create it in Google Cloud, download the JSON key, paste it into the env var{" "}
            <span className="font-mono">GOOGLE_SERVICE_ACCOUNT_JSON</span>, then add that account&apos;s email as Viewer in GA4 and as a user in Search Console. Details in{" "}
            <span className="text-mist/70">docs/ANALYTICS.md</span> in the repo.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className={`${button} bg-gold text-deep`}>
              {saving ? "Saving…" : "Save analytics"}
            </button>
            <span className="text-xs text-mist/50">
              Tracking: {trackingActive ? "on" : "off"} · Reporting API:{" "}
              {settings?.reportingConfigured ? "configured" : "not configured"}
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
