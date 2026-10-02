"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoney } from "@/lib/revenue";
import {
  PAYMENT_TYPES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type StudioNudge,
  type StudioProjectView,
  type StudioTaskView,
  type SuggestedTask,
} from "@/lib/studio";

type Fetch = (url: string, options?: RequestInit) => Promise<Response>;

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  notes: string;
};

type Snapshot = {
  clients: Client[];
  projects: StudioProjectView[];
  looseTasks: StudioTaskView[];
  dashboard: {
    activeProjects: number;
    totalClients: number;
    openTasks: number;
    overdue: StudioTaskView[];
    upcoming: StudioTaskView[];
    receivedPence: number;
    pipelinePence: number;
    nonMonetary: {
      projectId: string;
      title: string;
      clientName: string;
      status: string;
      paymentType: string;
      displayValue: string;
    }[];
    nextSteps: { projectId: string; projectTitle: string; taskTitle: string; phase: string }[];
    recent: StudioProjectView[];
  };
  nudges: StudioNudge[];
  openaiConfigured: boolean;
  actions: { id: string; label: string; hint: string }[];
  discoverySheet: string;
};

type View = "overview" | "projects" | "clients" | "tasks" | "copilot";

const input =
  "w-full border border-mist/10 bg-deep px-3 py-2 text-sm text-bone outline-none focus:border-gold/40";
const button = "border border-mist/10 px-3 py-2 text-xs tracking-wider text-mist/80 hover:text-bone";

function projectForm(project: StudioProjectView) {
  return {
    title: project.title,
    clientId: project.clientId ?? "",
    projectType: project.projectType,
    status: project.status,
    deadline: project.deadline,
    budget: project.budget,
    agreedCost: project.agreedCost,
    amountPaid: project.amountPaid,
    paymentType: project.paymentType,
    paymentNotes: project.paymentNotes,
    notes: project.notes,
    description: project.description,
    whatDoing: project.whatDoing,
    discoveryFeedback: project.discoveryFeedback,
    quoteText: project.quoteText,
    quoteFilename: project.quoteFilename,
    seedWorkflow: false,
  };
}

const emptyProject = {
  title: "",
  clientId: "",
  projectType: "website",
  status: "enquiry",
  deadline: "",
  budget: "",
  agreedCost: "",
  amountPaid: "",
  paymentType: "money",
  paymentNotes: "",
  notes: "",
  description: "",
  whatDoing: "",
  discoveryFeedback: "",
  quoteText: "",
  quoteFilename: "",
  seedWorkflow: true,
};

export function StudioPanel({ apiFetch }: { apiFetch: Fetch }) {
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copilotProjectId, setCopilotProjectId] = useState("");
  const [copilotAction, setCopilotAction] = useState("today");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/studio");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load projects");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function mutate(method: "POST" | "PATCH" | "DELETE", body?: unknown, query = "") {
    const res = await apiFetch(`/api/admin/studio${query}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    if (json.clients) setData(json);
    return json;
  }

  function openCopilot(action: string, projectId?: string) {
    setCopilotAction(action);
    if (projectId) setCopilotProjectId(projectId);
    setView("copilot");
  }

  if (loading && !data) return <p className="text-sm text-mist/60">Loading projects…</p>;
  if (!data) return <p className="text-sm text-red-400">{error || "Could not load projects."}</p>;

  const views: { id: View; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "projects", label: "Projects" },
    { id: "clients", label: "Clients" },
    { id: "tasks", label: "Tasks" },
    { id: "copilot", label: "Copilot" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {views.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`px-3 py-1.5 text-xs tracking-wider ${
              view === item.id ? "bg-gold text-deep" : "border border-mist/10 text-mist/60"
            }`}
          >
            {item.label.toUpperCase()}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {view === "overview" && (
        <Overview data={data} onOpenProject={(id) => { setSelectedId(id); setView("projects"); }} onCopilot={openCopilot} />
      )}
      {view === "projects" && (
        <Projects
          data={data}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onError={setError}
          mutate={mutate}
          onCopilot={openCopilot}
        />
      )}
      {view === "clients" && <Clients data={data} onError={setError} mutate={mutate} />}
      {view === "tasks" && <Tasks data={data} onError={setError} mutate={mutate} />}
      {view === "copilot" && (
        <Copilot
          data={data}
          action={copilotAction}
          projectId={copilotProjectId}
          onAction={setCopilotAction}
          onProject={setCopilotProjectId}
          onError={setError}
          apiFetch={apiFetch}
          onApplied={setData}
        />
      )}
    </div>
  );
}

function Overview({
  data,
  onOpenProject,
  onCopilot,
}: {
  data: Snapshot;
  onOpenProject: (id: string) => void;
  onCopilot: (action: string, projectId?: string) => void;
}) {
  const dash = data.dashboard;
  const cards = [
    ["Active projects", String(dash.activeProjects)],
    ["Clients", String(dash.totalClients)],
    ["Open tasks", String(dash.openTasks)],
    ["Overdue", String(dash.overdue.length)],
    ["Received", formatMoney(dash.receivedPence)],
    ["Pipeline", formatMoney(dash.pipelinePence)],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="border border-mist/10 bg-midnight/20 p-4">
            <p className="text-[10px] tracking-wider text-mist/50">{label.toUpperCase()}</p>
            <p className="mt-1 text-lg text-bone">{value}</p>
          </div>
        ))}
      </div>
      <section className="border border-mist/10 p-5">
        <h3 className="mb-3 text-xs tracking-wider text-gold">DO THIS NEXT</h3>
        {data.nudges.length === 0 && dash.nextSteps.length === 0 ? (
          <p className="text-sm text-mist/60">Nothing waiting. Add a project to start a board.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.nudges.slice(0, 5).map((nudge) => (
              <li key={nudge.id} className="flex items-center justify-between gap-3">
                <span>
                  <strong className="text-bone">{nudge.title}</strong>
                  <span className="ml-2 text-mist/50">{nudge.message}</span>
                </span>
                <button className={button} onClick={() => onCopilot(nudge.action, nudge.projectId)}>
                  OPEN
                </button>
              </li>
            ))}
            {dash.nextSteps.map((step) => (
              <li key={`${step.projectId}-${step.taskTitle}`}>
                <button className="text-left text-bone hover:text-gold" onClick={() => onOpenProject(step.projectId)}>
                  {step.projectTitle}
                </button>
                <span className="ml-2 text-mist/60">{step.taskTitle}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Projects({
  data,
  selectedId,
  onSelect,
  onError,
  mutate,
  onCopilot,
}: {
  data: Snapshot;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onError: (message: string) => void;
  mutate: (method: "POST" | "PATCH" | "DELETE", body?: unknown, query?: string) => Promise<unknown>;
  onCopilot: (action: string, projectId?: string) => void;
}) {
  const selected = data.projects.find((project) => project.id === selectedId) ?? null;
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(() => (selected ? projectForm(selected) : emptyProject));
  const [taskTitle, setTaskTitle] = useState("");

  function startCreate() {
    setCreating(true);
    onSelect(null);
    setForm(emptyProject);
  }

  function edit(project: StudioProjectView) {
    setCreating(false);
    onSelect(project.id);
    setForm(projectForm(project));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    onError("");
    try {
      const payload = {
        entity: "project" as const,
        ...form,
        clientId: form.clientId || null,
      };
      if (selected) {
        await mutate("PATCH", { ...payload, id: selected.id });
      } else {
        const saved = (await mutate("POST", payload)) as Snapshot;
        setCreating(false);
        if (saved.projects[0]) onSelect(saved.projects[0].id);
        return;
      }
      setCreating(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save project");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this project and its tasks?")) return;
    onError("");
    try {
      await mutate("DELETE", undefined, `?entity=project&id=${id}`);
      if (selectedId === id) onSelect(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not delete project");
    }
  }

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !taskTitle.trim()) return;
    onError("");
    try {
      await mutate("POST", { entity: "task", projectId: selected.id, title: taskTitle.trim() });
      setTaskTitle("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not add task");
    }
  }

  async function moveTask(task: StudioTaskView, status: string) {
    onError("");
    try {
      await mutate("PATCH", { entity: "task", id: task.id, status });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not move task");
    }
  }

  const showForm = creating || selected;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <button className="w-full bg-gold py-2 text-xs tracking-wider text-deep" onClick={startCreate}>
          NEW PROJECT
        </button>
        {data.projects.map((project) => (
          <button
            key={project.id}
            onClick={() => edit(project)}
            className={`block w-full border px-3 py-2 text-left text-sm ${
              project.id === selectedId ? "border-gold text-bone" : "border-mist/10 text-mist/70"
            }`}
          >
            <span className="block text-bone">{project.title}</span>
            <span className="text-[10px] tracking-wider text-mist/50">
              {(PROJECT_STATUSES.find((item) => item.id === project.status)?.label ?? project.status).toUpperCase()}
              {project.clientName ? ` · ${project.clientName}` : ""}
            </span>
          </button>
        ))}
      </div>

      {showForm ? (
        <div className="space-y-6">
        <form onSubmit={save} className="space-y-3 border border-mist/10 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <input className={input} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Client">
              <select className={input} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">None</option>
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select className={input} value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}>
                {PROJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {PROJECT_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
              </select>
            </Field>
            <Field label="Deadline">
              <input className={input} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
            <Field label="Payment">
              <select className={input} value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}>
                {PAYMENT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </Field>
            <Field label="Budget">
              <input className={input} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="£5,000" />
            </Field>
            <Field label="Agreed cost">
              <input className={input} value={form.agreedCost} onChange={(e) => setForm({ ...form, agreedCost: e.target.value })} />
            </Field>
            <Field label="Paid so far">
              <input className={input} value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea className={input} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Field label="What I'm doing">
            <textarea className={input} rows={2} value={form.whatDoing} onChange={(e) => setForm({ ...form, whatDoing: e.target.value })} />
          </Field>
          <Field label="Discovery notes">
            <textarea className={input} rows={6} value={form.discoveryFeedback} onChange={(e) => setForm({ ...form, discoveryFeedback: e.target.value })} />
            <button type="button" className={`${button} mt-2`} onClick={() => setForm({ ...form, discoveryFeedback: data.discoverySheet })}>
              INSERT QUESTION SHEET
            </button>
          </Field>
          <Field label="Quote text">
            <input className={`${input} mb-2`} value={form.quoteFilename} onChange={(e) => setForm({ ...form, quoteFilename: e.target.value })} placeholder="Filename, optional" />
            <textarea className={input} rows={4} value={form.quoteText} onChange={(e) => setForm({ ...form, quoteText: e.target.value })} placeholder="Paste the quote" />
          </Field>
          {creating && (
            <label className="flex items-center gap-2 text-xs text-mist/70">
              <input type="checkbox" checked={form.seedWorkflow} onChange={(e) => setForm({ ...form, seedWorkflow: e.target.checked })} />
              Seed the kanban from the project type
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="bg-gold px-4 py-2 text-xs tracking-wider text-deep">SAVE</button>
            {selected && (
              <>
                <button type="button" className={button} onClick={() => onCopilot("client_update", selected.id)}>DRAFT UPDATE</button>
                <button type="button" className={button} onClick={() => remove(selected.id)}>DELETE</button>
              </>
            )}
          </div>
        </form>
        {selected && (
          <div className="space-y-3 border border-mist/10 p-5">
            <form onSubmit={addTask} className="flex gap-2">
              <input className={input} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="New task" />
              <button className={button} type="submit">ADD</button>
            </form>
            <div className="grid gap-3 md:grid-cols-4">
              {TASK_STATUSES.map((column) => (
                <div key={column.id} className="border border-mist/10 p-2">
                  <p className="mb-2 text-[10px] tracking-wider text-gold">{column.label.toUpperCase()}</p>
                  {selected.tasks.filter((task) => task.status === column.id).map((task) => (
                    <div key={task.id} className="mb-2 border border-mist/10 p-2 text-xs">
                      {task.phase && <p className="text-[10px] text-mist/40">{task.phase}</p>}
                      <p className="text-bone">{task.title}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {TASK_STATUSES.filter((item) => item.id !== task.status).map((item) => (
                          <button key={item.id} type="button" className="text-[10px] text-mist/50 hover:text-gold" onClick={() => moveTask(task, item.id)}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      ) : (
        <p className="text-sm text-mist/60">Select a project or create one. Cash totals on the overview only count money deals.</p>
      )}
    </div>
  );
}

function Clients({
  data,
  onError,
  mutate,
}: {
  data: Snapshot;
  onError: (message: string) => void;
  mutate: (method: "POST" | "PATCH" | "DELETE", body?: unknown, query?: string) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    onError("");
    try {
      await mutate("POST", { entity: "client", name, email, phone, whatsapp, notes });
      setName("");
      setEmail("");
      setPhone("");
      setWhatsapp("");
      setNotes("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save client");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={create} className="space-y-3 border border-mist/10 p-5">
        <h3 className="text-xs tracking-wider text-gold">NEW CLIENT</h3>
        <input className={input} required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={input} placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <textarea className={input} rows={3} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button className="bg-gold px-4 py-2 text-xs tracking-wider text-deep" type="submit">SAVE</button>
      </form>
      <div className="space-y-2">
        {data.clients.length === 0 && <p className="text-sm text-mist/60">No clients yet.</p>}
        {data.clients.map((client) => (
          <article key={client.id} className="flex items-start justify-between border border-mist/10 p-4">
            <div>
              <p className="text-sm text-bone">{client.name}</p>
              <p className="text-xs text-mist/50">{[client.email, client.phone, client.whatsapp].filter(Boolean).join(" · ") || "No contact details"}</p>
            </div>
            <button
              className="text-xs text-mist/40 hover:text-red-400"
              onClick={() => {
                if (!confirm(`Delete ${client.name}? Their projects stay, unlinked.`)) return;
                mutate("DELETE", undefined, `?entity=client&id=${client.id}`).catch((err) => onError(err.message));
              }}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function Tasks({
  data,
  onError,
  mutate,
}: {
  data: Snapshot;
  onError: (message: string) => void;
  mutate: (method: "POST" | "PATCH" | "DELETE", body?: unknown, query?: string) => Promise<unknown>;
}) {
  const tasks = [
    ...data.projects.flatMap((project) => project.tasks),
    ...data.looseTasks,
  ];
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    onError("");
    try {
      await mutate("POST", {
        entity: "task",
        title,
        projectId: projectId || null,
        priority,
        dueDate,
      });
      setTitle("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not add task");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="grid gap-2 border border-mist/10 p-4 sm:grid-cols-4">
        <input className={input} required placeholder="Task" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className={input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">No project</option>
          {data.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <select className={input} value={priority} onChange={(e) => setPriority(e.target.value)}>
          {TASK_PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className={input} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button className="bg-gold px-4 py-2 text-xs tracking-wider text-deep sm:col-span-4" type="submit">ADD TASK</button>
      </form>
      {tasks.length === 0 && <p className="text-sm text-mist/60">No tasks yet.</p>}
      {tasks.map((task) => (
        <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 border border-mist/10 px-4 py-3">
          <div>
            <p className="text-sm text-bone">{task.title}</p>
            <p className="text-xs text-mist/50">{task.projectTitle || "No project"}{task.dueDate ? ` · due ${task.dueDate}` : ""}</p>
          </div>
          <select
            className={input + " max-w-[160px]"}
            value={task.status}
            onChange={(e) => mutate("PATCH", { entity: "task", id: task.id, status: e.target.value }).catch((err) => onError(err.message))}
          >
            {TASK_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function Copilot({
  data,
  action,
  projectId,
  onAction,
  onProject,
  onError,
  apiFetch,
  onApplied,
}: {
  data: Snapshot;
  action: string;
  projectId: string;
  onAction: (action: string) => void;
  onProject: (id: string) => void;
  onError: (message: string) => void;
  apiFetch: Fetch;
  onApplied: (snapshot: Snapshot) => void;
}) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);
  const [busy, setBusy] = useState(false);
  const hint = data.actions.find((item) => item.id === action)?.hint ?? "";

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    onError("");
    setBusy(true);
    try {
      const res = await apiFetch("/api/admin/studio", {
        method: "POST",
        body: JSON.stringify({
          entity: "copilot",
          action,
          message,
          projectId: projectId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Copilot failed");
      setReply(json.response || "");
      setTasks(json.tasks || []);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Copilot failed");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!projectId || tasks.length === 0) return;
    onError("");
    try {
      const res = await apiFetch("/api/admin/studio", {
        method: "POST",
        body: JSON.stringify({ entity: "applyTasks", projectId, tasks }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not add tasks");
      onApplied(json);
      setTasks([]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not add tasks");
    }
  }

  return (
    <form onSubmit={ask} className="space-y-3 border border-mist/10 p-5">
      {!data.openaiConfigured && (
        <p className="text-sm text-gold">Add OPENAI_API_KEY to use the copilot. Optional OPENAI_MODEL defaults to gpt-4o-mini.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <select className={input} value={action} onChange={(e) => onAction(e.target.value)}>
          {data.actions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select className={input} value={projectId} onChange={(e) => onProject(e.target.value)}>
          <option value="">All active projects</option>
          {data.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
      </div>
      <p className="text-xs text-mist/50">{hint}</p>
      <textarea className={input} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Paste a message, or leave a note for the copilot" />
      <button className="bg-gold px-4 py-2 text-xs tracking-wider text-deep disabled:opacity-50" disabled={busy} type="submit">
        {busy ? "THINKING…" : "ASK"}
      </button>
      {reply && <pre className="whitespace-pre-wrap border border-mist/10 p-4 text-sm text-mist/80">{reply}</pre>}
      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <p key={task.title} className="text-sm text-bone">{task.title}</p>
          ))}
          <button type="button" className={button} disabled={!projectId} onClick={apply}>
            ADD TASKS TO PROJECT
          </button>
        </div>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-xs text-mist/60">
      <span className="tracking-wider">{label.toUpperCase()}</span>
      {children}
    </label>
  );
}
