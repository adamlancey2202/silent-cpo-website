"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Layers, RefreshCw } from "lucide-react";
import {
  PLATFORM_CATEGORIES,
  type PlatformCategory,
  type PlatformProviderCard,
} from "@/lib/platform-providers";

type Props = {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
};

export function PlatformPanel({ apiFetch }: Props) {
  const [providers, setProviders] = useState<PlatformProviderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<"all" | PlatformCategory>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/platform");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load platform stack");
        return;
      }
      setProviders(data.providers || []);
    } catch {
      setError("Failed to load platform stack");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      category === "all"
        ? providers
        : providers.filter((p) => p.category === category),
    [providers, category]
  );

  const configuredCount = providers.filter((p) => p.configured).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg tracking-wider text-bone">
            PLATFORM
          </h2>
          <p className="mt-1 text-sm text-mist/60">
            Third-party services this site relies on — configured status and quick
            links to dashboards.
            {providers.length > 0 &&
              ` ${configuredCount} of ${providers.length} configured.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 border border-mist/10 px-3 py-2 text-xs text-mist/60 hover:text-gold disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <p className="border border-mist/10 bg-midnight/30 px-4 py-3 text-xs text-mist/60">
        Links open vendor dashboards. We do not pull live invoices — check{" "}
        <strong className="text-bone">Billing</strong> or{" "}
        <strong className="text-bone">Usage</strong> monthly so a quiet plan does
        not become a surprise bill.
      </p>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
          All
        </FilterChip>
        {PLATFORM_CATEGORIES.map((item) => (
          <FilterChip
            key={item}
            active={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </FilterChip>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading && providers.length === 0 ? (
        <p className="py-12 text-center text-sm text-mist/60">Loading stack…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((provider) => (
            <article
              key={provider.id}
              className="border border-mist/10 bg-midnight/20 p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gold/70" />
                  <h3 className="text-sm font-medium text-bone">{provider.name}</h3>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <span className="border border-mist/10 px-2 py-0.5 text-[10px] text-mist/60">
                    {provider.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] tracking-wider ${
                      provider.configured
                        ? "bg-green/15 text-green"
                        : "bg-mist/5 text-mist/50"
                    }`}
                  >
                    {provider.configured ? "CONFIGURED" : "NOT SET"}
                  </span>
                </div>
              </div>

              <p className="text-sm text-mist/70">{provider.usedFor}</p>

              <p className="mt-3 text-xs text-mist/50">
                <strong className="text-mist/70">Cost: </strong>
                {provider.costHint}
              </p>
              <p className="mt-1 text-xs text-mist/50">
                <strong className="text-mist/70">Check: </strong>
                {provider.check}
              </p>

              {provider.envKeys.length > 0 && (
                <p className="mt-3 font-mono text-[10px] text-mist/40">
                  {provider.envKeys.join(" · ")}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {provider.links.map((link) => (
                  <a
                    key={`${provider.id}-${link.label}`}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border border-mist/10 px-2 py-1 text-[11px] text-mist/60 hover:border-gold/30 hover:text-gold"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs tracking-wider transition ${
        active
          ? "bg-gold text-deep"
          : "border border-mist/10 text-mist/60 hover:text-bone"
      }`}
    >
      {children.toUpperCase()}
    </button>
  );
}
