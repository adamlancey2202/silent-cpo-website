"use client";
import { useCallback, useEffect, useState } from "react";
import { ArticleBody } from "@/components/ArticleBody";
import { ContentKind, Entry, kinds, statuses } from "@/lib/content/schema";
import { defaultData, fields, labels } from "@/lib/content/fields";
import { AnalyticsSnapshotPanel } from "@/components/admin/AnalyticsSnapshotPanel";
import { ContentStudioGuide } from "@/components/admin/ContentStudioGuide";

type Run = { id: string; requestKey: string; articleId: string; message: string; createdAt: string };
type Editor = { id?: string; version?: number; kind: ContentKind; title: string; status: string; slug?: string; data: Entry["data"] };
type Fetch = (url: string, options?: RequestInit) => Promise<Response>;
const input = "w-full rounded-lg border border-mist/20 bg-deep px-3 py-2 text-sm text-bone outline-none focus:border-gold";
const button = "rounded-lg border border-mist/20 px-4 py-2 text-sm hover:border-gold disabled:opacity-50";
export function ContentPanel({ apiFetch }: { apiFetch: Fetch }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [configured, setConfigured] = useState(false);
  const [draftWebhookConfigured, setDraftWebhookConfigured] = useState(false);
  const [triggeringDraft, setTriggeringDraft] = useState(false);
  const [section, setSection] = useState<ContentKind | "automation">("profile");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [preview, setPreview] = useState(false);
  const [origin, setOrigin] = useState("");
  const fetchContent = useCallback(async () => {
    const res = await apiFetch("/api/admin/content");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load content");
    return data as { entries: Entry[]; runs: Run[]; automationConfigured: boolean; draftWebhookConfigured: boolean };
  }, [apiFetch]);
  const applyContent = useCallback((data: { entries: Entry[]; runs: Run[]; automationConfigured: boolean; draftWebhookConfigured: boolean }) => {
    setOrigin(window.location.origin); setError("");
    setEntries(data.entries); setRuns(data.runs); setConfigured(data.automationConfigured);
    setDraftWebhookConfigured(data.draftWebhookConfigured);
  }, []);
  const load = useCallback(async () => {
    try { applyContent(await fetchContent()); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load content"); }
    finally { setLoading(false); }
  }, [fetchContent, applyContent]);
  useEffect(() => {
    let active = true;
    fetchContent().then((data) => { if (active) applyContent(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load content"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchContent, applyContent]);
  function open(entry?: Entry) {
    if (section === "automation") return;
    if (editor && !window.confirm("Discard unsaved editor changes?")) return;
    setEditor(entry ? { id: entry.id, version: entry.version, kind: entry.kind, title: entry.title, status: entry.status, ...(entry.slug ? { slug: entry.slug } : {}), data: entry.data } : { kind: section, title: section === "profile" ? "SilentCPO" : "", status: statuses[section][0], data: defaultData(section) });
    setPreview(false); setNotice(""); setError("");
  }
  function navigate(next: typeof section) {
    if (editor && !window.confirm("Discard unsaved editor changes?")) return;
    setSection(next); setEditor(null); setSearch(""); setStatusFilter(""); setPreview(false); setNotice("");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!editor || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const res = await apiFetch("/api/admin/content", { method: "POST", body: JSON.stringify(editor) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed");
      setEntries((all) => [result, ...all.filter((e) => e.id !== result.id)]);
      setEditor(null); setNotice(result.kind === "article" && result.status === "published" ? "Article published. It is now visible on the blog." : "Saved successfully.");
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }
  async function removeArticle(entry: Entry) {
    if (saving || triggeringDraft) return;
    const live = entry.status === "published";
    const prompt = live
      ? `Delete “${entry.title}” permanently? The live blog page will disappear. This cannot be undone.`
      : `Delete “${entry.title}” permanently? This cannot be undone.`;
    if (!window.confirm(prompt)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await apiFetch(`/api/admin/content/${entry.id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Delete failed");
      setEntries((all) => all.filter((e) => e.id !== entry.id));
      if (editor?.id === entry.id) setEditor(null);
      setNotice(result.message || "Article deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }
  async function triggerDraft() {
    if (triggeringDraft || saving) return;
    setTriggeringDraft(true); setError(""); setNotice("");
    try {
      const res = await apiFetch("/api/admin/content/trigger-draft", { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not start draft workflow");
      setNotice(result.message || "Draft workflow started.");
      setTimeout(() => { void load(); }, 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not start draft workflow"); }
    finally { setTriggeringDraft(false); }
  }
  const readyTopics = entries.filter((e) => e.kind === "topic" && e.status === "ready").length;
  const draftsToReview = entries.filter((e) => e.kind === "article" && ["draft", "review"].includes(e.status)).length;
  const publishedCount = entries.filter((e) => e.kind === "article" && e.status === "published").length;
  const visible = entries.filter((e) => e.kind === section && (!statusFilter || e.status === statusFilter) && e.title.toLowerCase().includes(search.toLowerCase()));
  const profile = entries.find((e) => e.kind === "profile");
  const profileApproved = profile?.status === "approved";
  return <section className="space-y-6" aria-label="Content studio">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs tracking-widest text-gold">CONTENT STUDIO</p><h2 className="mt-2 text-3xl font-medium">Ideas into useful articles.</h2><p className="mt-2 max-w-2xl text-sm text-mist/70">Prepare your facts, plan topics, and review drafts from your morning n8n run. Nothing publishes until you choose Published and save.</p></div>
      <button className={button} onClick={() => { setLoading(true); void load(); }} disabled={loading || saving}>Refresh content</button>
    </div>
    {!loading && (
      <ContentStudioGuide
        profileApproved={profileApproved}
        readyTopics={readyTopics}
        draftsToReview={draftsToReview}
        published={publishedCount}
        automationReady={configured}
        draftWebhookReady={draftWebhookConfigured}
        onGoTo={(next) => navigate(next)}
      />
    )}
    {!loading && <AnalyticsSnapshotPanel apiFetch={apiFetch} compact />}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Ready topics", readyTopics], ["Drafts to review", draftsToReview], ["Published", publishedCount], ["Approved sources", entries.filter((e) => e.kind === "source" && e.status === "approved").length]].map(([label, count]) => <div key={label} className="rounded-xl border border-mist/15 p-4"><p className="text-xs text-mist/70">{label}</p><p className="mt-2 text-2xl text-gold">{count}</p></div>)}</div>
    <nav aria-label="Content sections" className="flex flex-wrap gap-2">{[...kinds, "automation" as const].map((kind) => <button key={kind} disabled={saving} onClick={() => navigate(kind)} aria-pressed={section === kind} className={`${button} ${section === kind ? "bg-gold text-deep" : ""}`}>{kind === "automation" ? "n8n & history" : labels[kind]}</button>)}</nav>
    {error && <p role="alert" className="rounded-lg border border-red-400/40 p-4 text-sm text-red-300">{error}</p>}
    {notice && <p role="status" className="text-sm text-green">{notice}</p>}
    {loading ? <p role="status">Loading content…</p> : section === "automation" ? <div className="space-y-6">
      <div className="rounded-xl border border-mist/15 p-6"><h3 className="text-xl">Connect your local n8n</h3><p className="mt-3 text-sm text-mist/75">{configured ? "Automation token is configured on this server." : "Not connected yet. Set N8N_CONTENT_TOKEN on the site server and add the same value to an n8n Header Auth credential."} Use Authorization: Bearer YOUR_TOKEN. Keep this separate from your admin secret.</p>
        <p className="mt-4 break-all rounded bg-deep p-3 font-mono text-xs">GET / POST {origin}/api/automation/content</p>
        <p className="mt-3 break-all rounded bg-deep p-3 font-mono text-xs">POST {origin}/api/automation/content/topics</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-mist/75"><li>Approve the business profile (including <strong className="font-medium text-mist">Competitor websites and notes</strong> — the topic planner reads this field from the approved profile).</li><li>Run the n8n <strong className="font-medium text-mist">topic planner</strong> workflow to create Ready topics from competitors (then the draft workflow).</li><li>Or set a topic to Ready manually and run the draft workflow.</li><li>Review drafts in Articles. Publishing is only available here in admin.</li></ol>
        <p className="mt-4 text-sm text-mist/75">This connection can read approved material and add drafts. It cannot publish, change settings, or access enquiries and payments. OpenAI credentials stay in n8n.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-mist/15 pt-6">
          <button
            type="button"
            disabled={triggeringDraft || saving || !configured || !draftWebhookConfigured || readyTopics === 0}
            className={`${button} bg-gold text-deep`}
            onClick={() => void triggerDraft()}
          >
            {triggeringDraft ? "Starting draft…" : "Generate draft now"}
          </button>
          {!draftWebhookConfigured && <p className="text-sm text-mist/60">Set <span className="font-mono text-xs">N8N_DRAFT_WEBHOOK_URL</span> on the server to enable this button.</p>}
          {draftWebhookConfigured && readyTopics === 0 && <p className="text-sm text-mist/60">No Ready topics — approve or create topics first.</p>}
          {draftWebhookConfigured && readyTopics > 0 && <p className="text-sm text-mist/60">{readyTopics} Ready topic{readyTopics === 1 ? "" : "s"} available.</p>}
        </div>
      </div>
      <div className="rounded-xl border border-mist/15 p-6"><h3 className="text-xl">Draft delivery history</h3><p className="mt-2 text-sm text-mist/60">Latest 50 successful deliveries. Failed generation and connection attempts remain in n8n’s execution log.</p>{runs.length ? runs.map((run) => <div key={run.id} className="mt-4 border-t border-mist/15 pt-4 text-sm"><p>{run.message}</p><p className="mt-1 break-all text-mist/60">{new Date(run.createdAt).toLocaleString("en-GB")} · {run.requestKey}</p></div>) : <p className="mt-4 text-sm text-mist/60">No drafts received from n8n yet.</p>}</div>
    </div> : <>
      <div className="flex flex-wrap gap-3">
        <button disabled={saving || Boolean(error && !entries.length)} className={`${button} bg-gold text-deep`} onClick={() => open(section === "profile" ? profile : undefined)}>{section === "profile" ? profile ? "Edit business profile" : "Create business profile" : `New ${section === "backlink" ? "opportunity" : section}`}</button>
        {section !== "profile" && <><input className={`${input} max-w-xs`} aria-label="Search content" placeholder="Search titles…" value={search} onChange={(e) => setSearch(e.target.value)} /><select aria-label="Filter by status" className={`${input} max-w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{statuses[section].map((s) => <option key={s}>{s}</option>)}</select></>}
      </div>
      {section === "profile" && <p className="text-sm text-mist/70">The starter profile reflects your studio’s current positioning. Review it, then mark it Approved to share it with n8n.</p>}
      {section === "backlink" && <p className="text-sm text-mist/70">Keep a shortlist of relevant publications, collaborators and resources. This is an opportunity tracker; it does not place links or send outreach.</p>}
      {editor && <form onSubmit={save} className="space-y-5 rounded-xl border border-gold/30 bg-midnight/30 p-5 md:p-8">
        <div className="flex items-center justify-between gap-4"><h3 className="text-xl">{editor.id ? "Edit" : "New"} {labels[editor.kind].toLowerCase()}</h3><button type="button" disabled={saving} className={button} onClick={() => { if (window.confirm("Close without saving?")) setEditor(null); }}>Close editor</button></div>
        <label className="block space-y-2 text-sm"><span>Title</span><input required maxLength={200} className={input} value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} /></label>
        <label className="block space-y-2 text-sm"><span>Status</span><select className={input} value={editor.status} onChange={(e) => setEditor({ ...editor, status: e.target.value })}>{statuses[editor.kind].map((s) => <option key={s}>{s}</option>)}</select></label>
        {["profile", "source"].includes(editor.kind) && <p className="text-sm text-gold">Approved content is available to your n8n workflow and any model you connect to it. Private content stays in admin.</p>}
        {editor.kind === "article" && <label className="block space-y-2 text-sm"><span>URL slug</span><input className={input} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="how-to-plan-your-app" value={editor.slug ?? ""} onChange={(e) => setEditor({ ...editor, slug: e.target.value || undefined })} /><span className="text-xs text-mist/60">Lowercase words separated by hyphens. Locked after first publication.</span></label>}
        {fields[editor.kind].map((field) => <label key={field.key} className="block space-y-2 text-sm"><span>{field.label}</span>{field.type === "textarea" ? <textarea rows={field.key === "body" ? 18 : 4} className={input} value={String(editor.data[field.key] ?? "")} onChange={(e) => setEditor({ ...editor, data: { ...editor.data, [field.key]: e.target.value } })} /> : field.type === "select" ? <select className={input} value={String(editor.data[field.key] ?? "")} onChange={(e) => setEditor({ ...editor, data: { ...editor.data, [field.key]: e.target.value } })}>{field.options?.map((o) => <option key={o}>{o}</option>)}</select> : <input className={input} type={field.type ?? "text"} min={field.type === "number" ? 1 : undefined} max={field.type === "number" ? 5 : undefined} value={String(editor.data[field.key] ?? "")} onChange={(e) => setEditor({ ...editor, data: { ...editor.data, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value } })} />}{field.help && <span className="block text-xs text-mist/60">{field.help}</span>}</label>)}
        {editor.kind === "article" && <><button type="button" className={button} onClick={() => setPreview(!preview)}>{preview ? "Hide preview" : "Preview article"}</button>{preview && <article className="rounded-xl border border-mist/15 p-6"><h2 className="mb-6 text-3xl">{editor.title}</h2><ArticleBody body={String(editor.data.body ?? "")} /></article>}</>}
        <div className="flex flex-wrap items-center gap-4">
          <button disabled={saving} className={`${button} bg-gold text-deep`}>{saving ? "Saving…" : editor.kind === "article" && editor.status === "published" ? "Save & publish" : "Save changes"}</button>
          {editor.kind === "article" && editor.id && (
            <button
              type="button"
              disabled={saving}
              className={`${button} border-red-400/40 text-red-300 hover:border-red-400`}
              onClick={() => {
                const match = entries.find((e) => e.id === editor.id);
                if (match) void removeArticle(match);
              }}
            >
              Delete article
            </button>
          )}
          {editor.kind === "article" && <p className="text-xs text-mist/65">Draft, review and archived articles are private. Saving a published article updates the live page.</p>}
        </div>
      </form>}
      <div className="space-y-3">{visible.length ? visible.map((entry) => <article key={entry.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-mist/15 p-5"><div className="min-w-0"><p className="text-xs uppercase tracking-wider text-gold">{entry.status}{entry.kind === "topic" ? ` · Priority ${entry.data.priority}${entry.data.plannedDate ? ` · ${entry.data.plannedDate}` : ""}` : ""}</p><h3 className="mt-1 break-words text-lg">{entry.title}</h3><p className="mt-1 text-xs text-mist/60">Updated {new Date(entry.updatedAt).toLocaleString("en-GB")}</p></div><div className="flex flex-wrap gap-3">{entry.kind === "article" && entry.status === "published" && <a className={button} target="_blank" rel="noopener noreferrer" href={`/blog/${entry.slug}`}>View live</a>}<button className={button} disabled={saving} onClick={() => open(entry)}>Edit<span className="sr-only"> {entry.title}</span></button>{entry.kind === "article" && <button type="button" className={`${button} border-red-400/30 text-red-300 hover:border-red-400`} disabled={saving} onClick={() => void removeArticle(entry)}>Delete</button>}</div></article>) : <div className="rounded-xl border border-dashed border-mist/20 p-8 text-sm text-mist/65">{search || statusFilter ? "No entries match your filters." : `No ${labels[section].toLowerCase()} saved yet. Start with the button above.`}</div>}</div>
    </>}
  </section>;
}
