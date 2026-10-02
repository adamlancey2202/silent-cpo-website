"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

type Fetch = (url: string, options?: RequestInit) => Promise<Response>;

type Lead = {
  id: string;
  url: string;
  source: string;
  title: string;
  excerpt: string;
  score: number;
  budget: string;
  why: string;
  reply: string;
  contactEmail: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
};

type Filter = "new" | "sent" | "dismissed";

const input =
  "w-full border border-mist/10 bg-deep px-3 py-2 text-sm text-bone outline-none focus:border-gold/40";
const button = "border border-mist/10 px-3 py-2 text-xs tracking-wider text-mist/80 hover:text-bone disabled:opacity-50";

export function ProjectLeadsPanel({
  apiFetch,
  onNewCount,
}: {
  apiFetch: Fetch;
  onNewCount: (count: number) => void;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<Filter>("new");
  const [drafts, setDrafts] = useState<Record<string, { email: string; reply: string }>>({});
  const [mailersendConfigured, setMailersendConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const onNewCountRef = useRef(onNewCount);
  onNewCountRef.current = onNewCount;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/project-leads");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load listings");
      const next = (data.leads ?? []) as Lead[];
      setLeads(next);
      setMailersendConfigured(Boolean(data.mailersendConfigured));
      onNewCountRef.current(typeof data.newCount === "number" ? data.newCount : next.filter((lead) => lead.status === "new").length);
      setDrafts((current) => {
        const merged = { ...current };
        for (const lead of next) {
          if (!merged[lead.id]) merged[lead.id] = { email: lead.contactEmail, reply: lead.reply };
        }
        return merged;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  function draftFor(lead: Lead) {
    return drafts[lead.id] ?? { email: lead.contactEmail, reply: lead.reply };
  }

  async function setStatus(id: string, status: "new" | "dismissed") {
    setBusyId(id);
    setError("");
    try {
      const res = await apiFetch("/api/admin/project-leads", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the listing");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the listing");
    } finally {
      setBusyId("");
    }
  }

  async function send(lead: Lead) {
    const draft = draftFor(lead);
    setBusyId(`${lead.id}:send`);
    setError("");
    try {
      const res = await apiFetch("/api/admin/project-leads/send", {
        method: "POST",
        body: JSON.stringify({ id: lead.id, email: draft.email, reply: draft.reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email could not be sent");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email could not be sent");
    } finally {
      setBusyId("");
    }
  }

  const visible = leads.filter((lead) => lead.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-wider text-gold">PROJECT FINDER</h2>
          <p className="mt-1 text-xs text-mist/60">
            Review scored listings, edit the reply, then send it yourself.
          </p>
        </div>
        <div className="flex gap-2">
          {(["new", "sent", "dismissed"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={filter === status ? "bg-gold px-3 py-2 text-xs tracking-wider text-deep" : button}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {!mailersendConfigured && (
        <p className="text-sm text-gold">
          MailerSend is not configured, so Send email will fail until the site has a sender.
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-mist/60">Loading listings…</p>}

      {!loading && visible.length === 0 && (
        <p className="border border-mist/10 p-6 text-sm text-mist/60">
          {filter === "new"
            ? "No listings waiting. Run the project finder workflow in n8n and they will show up here."
            : `Nothing in ${filter}.`}
        </p>
      )}

      {visible.map((lead) => {
        const draft = draftFor(lead);
        const busy = busyId === lead.id || busyId === `${lead.id}:send`;
        return (
          <article key={lead.id} className="space-y-3 border border-mist/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-wider text-gold">
                  {lead.score}/10 · {lead.source} · {lead.budget || "Budget not stated"}
                </p>
                <h3 className="mt-1 font-medium text-bone">{lead.title}</h3>
              </div>
              <a
                href={lead.url}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1 text-xs text-mist/60 hover:text-gold"
              >
                Open listing
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            {lead.why && <p className="text-sm text-mist/80">{lead.why}</p>}
            {lead.excerpt && (
              <p className="line-clamp-4 text-xs leading-relaxed text-mist/50">{lead.excerpt}</p>
            )}
            <label className="block text-[10px] tracking-wider text-mist/50">
              REPLY
              <textarea
                value={draft.reply}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [lead.id]: { ...draft, reply: event.target.value },
                  }))
                }
                rows={10}
                className={`${input} mt-1`}
              />
            </label>
            <label className="block text-[10px] tracking-wider text-mist/50">
              THEIR EMAIL
              <input
                value={draft.email}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [lead.id]: { ...draft, email: event.target.value },
                  }))
                }
                placeholder="Paste an email from the listing"
                className={`${input} mt-1`}
              />
            </label>
            <p className="text-[10px] text-mist/40">
              Most posts do not include an email. Open the listing, copy one if it is there, then send.
              {lead.sentAt ? ` Sent ${new Date(lead.sentAt).toLocaleString("en-GB")}.` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => send(lead)} className="bg-gold px-3 py-2 text-xs tracking-wider text-deep disabled:opacity-50">
                {busyId === `${lead.id}:send` ? "SENDING" : "SEND EMAIL"}
              </button>
              {lead.status !== "dismissed" && lead.status !== "sent" && (
                <button type="button" disabled={busy} onClick={() => setStatus(lead.id, "dismissed")} className={button}>
                  DISMISS
                </button>
              )}
              {lead.status === "dismissed" && (
                <button type="button" disabled={busy} onClick={() => setStatus(lead.id, "new")} className={button}>
                  RESTORE
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
