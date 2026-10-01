"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, ExternalLink } from "lucide-react";

type Settings = {
  ga4MeasurementId: string;
  version: number;
  updatedAt: string | null;
  source: "database" | "environment" | "none";
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
        body: JSON.stringify({ version: settings.version, ga4MeasurementId: ga4.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSettings(data);
      setGa4(data.ga4MeasurementId);
      setNotice(data.ga4MeasurementId ? "Analytics saved. Tracking is active on the public site." : "Analytics cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const active = Boolean(ga4.trim());
  const envFallback = settings?.source === "environment";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg tracking-wider text-bone">
          <BarChart3 className="h-5 w-5 text-gold" />
          ANALYTICS
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-mist/60">
          Connect Google Analytics 4 to see which pages and blog posts get traffic. Measurement IDs are public (they appear in the browser); saving here updates production after the next page load.
        </p>
      </div>

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
              pattern="G-[A-Za-z0-9]*"
              autoComplete="off"
            />
            <span className="block text-xs text-mist/50">
              From Google Analytics → Admin → Data streams → your web stream. Leave blank to disable.
            </span>
          </label>

          {envFallback && !settings?.ga4MeasurementId && (
            <p className="text-xs text-gold">
              A measurement ID is currently loaded from the server environment variable{" "}
              <span className="font-mono">GA4_MEASUREMENT_ID</span>. Save here to store it in the database instead.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className={`${button} bg-gold text-deep`}>
              {saving ? "Saving…" : "Save analytics"}
            </button>
            <span className="text-xs text-mist/50">
              Status: {active ? "tracking enabled" : "not configured"}
            </span>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-mist/10 bg-midnight/20 p-6 text-sm text-mist/70">
        <h3 className="text-bone">Which posts worked?</h3>
        <p className="mt-2">
          In GA4, open <strong className="font-normal text-mist">Reports → Engagement → Pages and screens</strong>. Filter or sort by{" "}
          <span className="font-mono text-xs">/blog/</span> paths to compare articles. Allow 24–48 hours after publishing for meaningful data.
        </p>
        <a
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-gold hover:underline"
        >
          Open Google Analytics
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
