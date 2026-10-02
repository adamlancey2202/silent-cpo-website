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
  budget: string;
  quote: string;
  timeline: string;
  reply: string;
  contactEmail: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
};

type Filter = "new" | "bidded" | "sent" | "dismissed";

const input =
  "w-full border border-mist/10 bg-deep px-3 py-2 text-sm text-bone outline-none focus:border-gold/40";
const button = "border border-mist/10 px-3 py-2 text-xs tracking-wider text-mist/80 hover:text-bone disabled:opacity-50";
const DESCRIPTION_LIMIT = 280;

function listingDescription(excerpt: string) {
  const text = excerpt
    .replace(/^Budget:\s*\d[\d,]*(?:\.\d+)?(?:\s*-\s*\d[\d,]*(?:\.\d+)?)?\s*[A-Za-z]{2,5}\s*/i, "")
    .trim();
  if (text.length <= DESCRIPTION_LIMIT) return text;
  const cut = text.slice(0, DESCRIPTION_LIMIT);
  const at = cut.lastIndexOf(" ");
  return `${(at > 180 ? cut.slice(0, at) : cut).trimEnd()}…`;
}

export function ProjectLeadsPanel({
  apiFetch,
  onNewCount,
}: {
  apiFetch: Fetch;
  onNewCount: (count: number) => void;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<Filter>("new");
  const [drafts, setDrafts] = useState<Record<string, { email: string; reply: string; quote: string }>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [cardError, setCardError] = useState<Record<string, string>>({});
  const [opened, setOpened] = useState<Record<string, boolean>>({});
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
      onNewCountRef.current(typeof data.newCount === "number" ? data.newCount : next.filter((lead) => lead.status === "new").length);
      setDrafts((current) => {
        const merged = { ...current };
        for (const lead of next) {
          if (!merged[lead.id]) merged[lead.id] = { email: lead.contactEmail, reply: lead.reply, quote: lead.quote };
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
    return drafts[lead.id] ?? { email: lead.contactEmail, reply: lead.reply, quote: lead.quote };
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

  async function createResponse(lead: Lead) {
    setBusyId(`${lead.id}:draft`);
    setCardError((current) => ({ ...current, [lead.id]: "" }));
    try {
      const res = await apiFetch("/api/admin/project-leads/draft", {
        method: "POST",
        body: JSON.stringify({ id: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not draft a response");
      setDrafts((current) => ({
        ...current,
        [lead.id]: { email: draftFor(lead).email, reply: data.reply ?? "", quote: data.quote ?? lead.quote },
      }));
      setOpened((current) => ({ ...current, [lead.id]: true }));
      setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ...data } : item)));
    } catch (err) {
      setCardError((current) => ({
        ...current,
        [lead.id]: err instanceof Error ? err.message : "Could not draft a response",
      }));
    } finally {
      setBusyId("");
    }
  }

  async function markBidded(lead: Lead) {
    const draft = draftFor(lead);
    setBusyId(`${lead.id}:bid`);
    setCardError((current) => ({ ...current, [lead.id]: "" }));
    try {
      const res = await apiFetch("/api/admin/project-leads", {
        method: "PATCH",
        body: JSON.stringify({ id: lead.id, status: "bidded", reply: draft.reply, quote: draft.quote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the bid");
      setFilter("bidded");
      await load();
    } catch (err) {
      setCardError((current) => ({
        ...current,
        [lead.id]: err instanceof Error ? err.message : "Could not save the bid",
      }));
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
            Read the listing, create the proposal, place it on Freelancer, then mark it as bidded.
          </p>
        </div>
        <div className="flex gap-2">
          {(["new", "bidded", "sent", "dismissed"] as const).map((status) => (
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
        const busy = busyId.startsWith(lead.id);
        return (
          <article key={lead.id} className="space-y-3 border border-mist/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-wider text-gold">
                  {lead.source}
                  {lead.budget ? ` · ${lead.budget}` : ""}
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
            {lead.excerpt && (
              <p className="text-sm leading-relaxed text-mist/70">
                {listingDescription(lead.excerpt)}{" "}
                <a href={lead.url} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                  View online
                </a>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => createResponse(lead)} className={button}>
                {busyId === `${lead.id}:draft` ? "DRAFTING" : "CREATE RESPONSE"}
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
            {cardError[lead.id] && <p className="text-sm text-red-400">{cardError[lead.id]}</p>}
            {(opened[lead.id] || lead.status === "sent" || lead.status === "bidded") && draft.reply.trim() && (
              <>
                <label className="block text-[10px] tracking-wider text-mist/50">
                  BID AMOUNT
                  <input
                    value={draft.quote}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [lead.id]: { ...draft, quote: event.target.value },
                      }))
                    }
                    className={`${input} mt-1`}
                  />
                </label>
                {lead.timeline && <p className="text-xs text-gold">Delivered in {lead.timeline}</p>}
                <label className="block text-[10px] tracking-wider text-mist/50">
                  PROPOSAL · {draft.reply.trim().length} CHARACTERS
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
                <p className="text-[10px] text-mist/40">
                  Paste the bid amount, days, milestone and proposal into Freelancer. The proposal box needs at least 100 characters.
                  {lead.sentAt ? ` Saved ${new Date(lead.sentAt).toLocaleString("en-GB")}.` : ""}
                </p>
                {lead.status !== "sent" && (
                  <button type="button" disabled={busy || !draft.reply.trim()} onClick={() => markBidded(lead)} className="bg-gold px-3 py-2 text-xs tracking-wider text-deep disabled:opacity-50">
                    {busyId === `${lead.id}:bid` ? "SAVING" : lead.status === "bidded" ? "SAVE BID" : "MARK AS BIDDED"}
                  </button>
                )}
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
