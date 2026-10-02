export const PROJECT_STATUSES = [
  { id: "enquiry", label: "Enquiry" },
  { id: "quoted", label: "Quoted" },
  { id: "in_progress", label: "In Progress" },
  { id: "waiting", label: "Waiting on Client" },
  { id: "done", label: "Done" },
  { id: "paid", label: "Paid" },
] as const;

export const PROJECT_TYPES = [
  "website",
  "webapp",
  "app",
  "mobile",
  "platform",
  "tool",
  "branding",
  "maintenance",
  "other",
] as const;

export const TASK_STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
] as const;

export const PAYMENT_TYPES = [
  { id: "money", label: "Money" },
  { id: "vouchers", label: "Vouchers" },
  { id: "other", label: "In-kind / other" },
] as const;

export const TASK_PRIORITIES = ["high", "medium", "low"] as const;

const PIPELINE_STATUSES = new Set(["enquiry", "quoted", "in_progress", "waiting"]);
const CLOSED_STATUSES = new Set(["done", "paid"]);

const BUDGET_RANGES: Record<string, number> = {
  "under-5k": 250_000,
  "5k-15k": 1_000_000,
  "15k-50k": 3_250_000,
  "50k-plus": 7_500_000,
};

export const DISCOVERY_SHEET = `# Discovery call — question sheet

**Project:**
**Client:**
**Date:**

## 1. Business & goals
- What does the business do, in their own words?
- Why this project now?
- What does success look like in 3–6 months?

## 2. Audience
- Who is the primary audience?
- Who are 2–3 competitors or sites they admire?

## 3. Scope
- Must-have features or pages
- Nice-to-have
- Who provides copy, images, and brand assets?
- Integrations (CRM, booking, payments, email, analytics)

## 4. Timeline & budget
- Target launch date
- Hard deadlines
- Budget range and who approves it

## 5. Open questions before quoting
`;

type TemplateTask = { title: string; phase: string };

const BASE: TemplateTask[] = [
  { title: "Discovery call & capture requirements", phase: "Discovery" },
  { title: "Send scope document & timeline to client", phase: "Discovery" },
  { title: "Client sign-off on scope", phase: "Discovery" },
];

const LAUNCH: TemplateTask[] = [
  { title: "Final QA & bug fixes", phase: "Launch" },
  { title: "Deploy to production", phase: "Launch" },
  { title: "Client handover & documentation", phase: "Launch" },
  { title: "30-day post-launch check-in", phase: "Launch" },
];

const TYPE_TASKS: Record<string, TemplateTask[]> = {
  website: [
    { title: "Sitemap & page structure", phase: "Planning" },
    { title: "Collect content & assets from client", phase: "Planning" },
    { title: "Wireframes / layout approval", phase: "Design" },
    { title: "Next.js setup with SEO foundation", phase: "Build" },
    { title: "Build pages & components", phase: "Build" },
    { title: "Mobile responsiveness pass", phase: "Build" },
    { title: "Lighthouse & performance audit", phase: "Build" },
    { title: "Client review round", phase: "Review" },
    { title: "DNS & domain configuration", phase: "Launch" },
  ],
  webapp: [
    { title: "User stories & feature list", phase: "Planning" },
    { title: "Database schema design", phase: "Architecture" },
    { title: "API & auth architecture", phase: "Architecture" },
    { title: "UI wireframes & user flows", phase: "Design" },
    { title: "Frontend scaffold & routing", phase: "Build" },
    { title: "Core features — sprint 1", phase: "Build" },
    { title: "Core features — sprint 2", phase: "Build" },
    { title: "Integration & API testing", phase: "Build" },
    { title: "Staging deploy & UAT", phase: "Review" },
  ],
  app: [
    { title: "User stories & feature list", phase: "Planning" },
    { title: "Database schema design", phase: "Architecture" },
    { title: "UI wireframes & user flows", phase: "Design" },
    { title: "Frontend scaffold & routing", phase: "Build" },
    { title: "Core features — sprint 1", phase: "Build" },
    { title: "Staging deploy & UAT", phase: "Review" },
  ],
  mobile: [
    { title: "App store requirements check", phase: "Planning" },
    { title: "Platform scope (iOS / Android / both)", phase: "Planning" },
    { title: "User flows & screen wireframes", phase: "Design" },
    { title: "Backend API setup", phase: "Architecture" },
    { title: "Expo / React Native scaffold", phase: "Build" },
    { title: "Core screens & navigation", phase: "Build" },
    { title: "TestFlight / internal beta", phase: "Review" },
    { title: "Store submission", phase: "Launch" },
  ],
  platform: [
    { title: "Membership tiers & pricing model", phase: "Planning" },
    { title: "Auth & role architecture", phase: "Architecture" },
    { title: "Stripe subscription integration", phase: "Architecture" },
    { title: "Gated content & access rules", phase: "Build" },
    { title: "Admin panel for content management", phase: "Build" },
    { title: "Beta user testing", phase: "Review" },
  ],
  tool: [
    { title: "Logic & formula definition", phase: "Planning" },
    { title: "Input / output UX mapping", phase: "Design" },
    { title: "Build calculator engine", phase: "Build" },
    { title: "Client UAT", phase: "Review" },
  ],
  branding: [
    { title: "Brand discovery workshop", phase: "Discovery" },
    { title: "Mood boards & direction", phase: "Design" },
    { title: "Logo concepts", phase: "Design" },
    { title: "Client review & refinement", phase: "Review" },
    { title: "Final brand guidelines", phase: "Launch" },
  ],
  maintenance: [
    { title: "Audit current site/app", phase: "Planning" },
    { title: "Agree scope of changes", phase: "Discovery" },
    { title: "Implement updates", phase: "Build" },
    { title: "Deploy & verify", phase: "Launch" },
  ],
  other: [
    { title: "Technical architecture document", phase: "Architecture" },
    { title: "Milestone 1 — define & deliver", phase: "Build" },
    { title: "Client feedback & iteration", phase: "Review" },
    { title: "Final QA pass", phase: "Review" },
  ],
};

export type StudioTaskView = {
  id: string;
  projectId: string | null;
  projectTitle: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  phase: string;
  sortOrder: number;
  onTaskList: boolean;
};

export type StudioProjectView = {
  id: string;
  clientId: string | null;
  clientName: string;
  title: string;
  description: string;
  projectType: string;
  status: string;
  budget: string;
  agreedCost: string;
  amountPaid: string;
  paymentType: string;
  paymentNotes: string;
  deadline: string;
  notes: string;
  whatDoing: string;
  discoveryFeedback: string;
  quoteText: string;
  quoteFilename: string;
  createdAt: string;
  tasks: StudioTaskView[];
};

export type StudioNudge = {
  id: string;
  priority: "high" | "medium" | "low";
  projectId: string;
  title: string;
  message: string;
  action: string;
};

export type SuggestedTask = {
  title: string;
  description?: string;
  priority?: string;
  dueInDays?: number;
};

export function workflowForType(projectType: string): TemplateTask[] {
  const key = TYPE_TASKS[projectType] ? projectType : "other";
  return [...BASE, ...TYPE_TASKS[key], ...LAUNCH];
}

export function parseBudgetPence(value: string | null | undefined): number {
  if (!value) return 0;
  const key = value.trim().toLowerCase();
  if (key in BUDGET_RANGES) return BUDGET_RANGES[key];
  const match = value.replace(/,/g, "").replace(/£/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return Math.round(Number(match[1]) * 100);
}

function paymentTypeOf(project: Pick<StudioProjectView, "paymentType">) {
  return PAYMENT_TYPES.some((item) => item.id === project.paymentType)
    ? project.paymentType
    : "money";
}

export function formatProjectValue(
  project: Pick<
    StudioProjectView,
    "budget" | "agreedCost" | "amountPaid" | "paymentType" | "paymentNotes"
  >,
) {
  const agreed = (project.agreedCost || project.budget || "").trim();
  const paid = project.amountPaid.trim();
  if (!agreed && !paid) return "—";
  const progress = paid && agreed ? `${paid} paid · ${agreed} agreed` : agreed || `${paid} paid so far`;
  const type = paymentTypeOf(project);
  const labelled =
    type === "vouchers" ? `${progress} (vouchers)` : type === "other" ? `${progress} (in-kind)` : progress;
  const notes = project.paymentNotes.trim();
  return notes && type !== "money" ? `${labelled} — ${notes}` : labelled;
}

function paymentSplit(project: StudioProjectView) {
  if (paymentTypeOf(project) !== "money") return { received: 0, pipeline: 0 };
  const agreed = parseBudgetPence(project.agreedCost || project.budget);
  const paid = parseBudgetPence(project.amountPaid);
  if (project.status === "paid") return { received: Math.max(agreed, paid), pipeline: 0 };
  if (!PIPELINE_STATUSES.has(project.status)) return { received: 0, pipeline: 0 };
  const received = agreed ? Math.min(paid, agreed) : paid;
  const pipeline = agreed ? Math.max(0, agreed - received) : 0;
  return { received, pipeline };
}

function parseDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(iso: string) {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return 0;
  return Math.floor((Date.now() - created.getTime()) / 86_400_000);
}

function docs(project: StudioProjectView) {
  const discovery = project.discoveryFeedback.trim();
  const hasQuote = Boolean(project.quoteFilename.trim() || project.quoteText.trim());
  return {
    hasDiscovery: discovery.length > 60,
    hasDescription: project.description.trim().length > 20,
    hasQuote,
    discoveryDone: discovery.length > 60 || hasQuote,
  };
}

export function computeNudges(projects: StudioProjectView[]): StudioNudge[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nudges: StudioNudge[] = [];

  for (const project of projects) {
    const age = daysSince(project.createdAt);
    const open = project.tasks.filter((task) => task.status !== "done");
    const doc = docs(project);

    if (project.status === "enquiry" && !doc.discoveryDone && !doc.hasDescription) {
      nudges.push({
        id: `triage-${project.id}`,
        priority: "high",
        projectId: project.id,
        title: `Scope new enquiry: ${project.title}`,
        message: "No discovery notes or quote yet.",
        action: "triage",
      });
    }
    if (project.status === "quoted" && age >= 7) {
      nudges.push({
        id: `quote-${project.id}`,
        priority: "medium",
        projectId: project.id,
        title: `Follow up on quote: ${project.title}`,
        message: `Quoted ${age} days ago.`,
        action: "client_update",
      });
    }
    if ((project.status === "in_progress" || project.status === "waiting") && age >= 10 && open.length > 0) {
      nudges.push({
        id: `stale-${project.id}`,
        priority: "medium",
        projectId: project.id,
        title: `Project going quiet: ${project.title}`,
        message: `Active for ${age}+ days with open tasks.`,
        action: "client_update",
      });
    }
    if (project.status === "done") {
      nudges.push({
        id: `invoice-${project.id}`,
        priority: "high",
        projectId: project.id,
        title: `Invoice & handover: ${project.title}`,
        message: "Marked done — send handover and invoice if it is not paid.",
        action: "client_update",
      });
    }
    const deadline = parseDay(project.deadline);
    if (deadline && !CLOSED_STATUSES.has(project.status)) {
      const daysLeft = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
      if (daysLeft >= 0 && daysLeft <= 3) {
        nudges.push({
          id: `deadline-${project.id}`,
          priority: daysLeft <= 1 ? "high" : "medium",
          projectId: project.id,
          title: `Deadline in ${daysLeft} day${daysLeft === 1 ? "" : "s"}: ${project.title}`,
          message: `${open.length} open task${open.length === 1 ? "" : "s"}.`,
          action: "deadline",
        });
      }
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  return nudges.sort((a, b) => rank[a.priority] - rank[b.priority]);
}

export function buildDashboard(
  projects: StudioProjectView[],
  clientCount: number,
  looseTasks: StudioTaskView[] = [],
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let received = 0;
  let pipeline = 0;
  const nonMonetary = [];
  const nextSteps = [];
  const overdue = [];
  const upcoming = [];

  for (const project of projects) {
    const split = paymentSplit(project);
    received += split.received;
    pipeline += split.pipeline;
    if (paymentTypeOf(project) !== "money" && PIPELINE_STATUSES.has(project.status)) {
      nonMonetary.push({
        projectId: project.id,
        title: project.title,
        clientName: project.clientName,
        status: project.status,
        paymentType: project.paymentType,
        displayValue: formatProjectValue(project),
      });
    }
    if (!CLOSED_STATUSES.has(project.status)) {
      const next = [...project.tasks]
        .filter((task) => task.status === "in_progress" || task.status === "todo")
        .sort((a, b) => {
          const rank = a.status === "in_progress" ? 0 : 1;
          const other = b.status === "in_progress" ? 0 : 1;
          return rank - other || a.sortOrder - b.sortOrder;
        })[0];
      if (next) {
        nextSteps.push({
          projectId: project.id,
          projectTitle: project.title,
          taskTitle: next.title,
          phase: next.phase,
        });
      }
    }
    for (const task of project.tasks) {
      if (task.status === "done" || !task.dueDate) continue;
      const due = parseDay(task.dueDate);
      if (!due) continue;
      if (due < today) overdue.push(task);
      else upcoming.push(task);
    }
  }

  upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    activeProjects: projects.filter((project) => !CLOSED_STATUSES.has(project.status)).length,
    totalClients: clientCount,
    openTasks: [
      ...projects.flatMap((project) => project.tasks.filter((task) => task.onTaskList)),
      ...looseTasks,
    ].filter((task) => task.status !== "done").length,
    overdue,
    upcoming: upcoming.slice(0, 8),
    receivedPence: received,
    pipelinePence: pipeline,
    nonMonetary,
    nextSteps: nextSteps.slice(0, 8),
    recent: projects.slice(0, 6),
  };
}

export function projectContext(project: StudioProjectView) {
  const taskLines = project.tasks
    .map((task) => `- [${task.status}] ${task.title}${task.phase ? ` (${task.phase})` : ""}`)
    .join("\n");
  const parts = [
    `Project: ${project.title}`,
    `Client: ${project.clientName || "none"}`,
    `Type: ${project.projectType}`,
    `Status: ${project.status}`,
    `Deadline: ${project.deadline || "none"}`,
    `Value: ${formatProjectValue(project)}`,
    project.description && `Description:\n${project.description}`,
    project.whatDoing && `Current focus:\n${project.whatDoing}`,
    project.notes && `Notes:\n${project.notes}`,
    project.discoveryFeedback && `Discovery:\n${project.discoveryFeedback.slice(0, 6000)}`,
    project.quoteText && `Quote:\n${project.quoteText.slice(0, 6000)}`,
    taskLines && `Tasks:\n${taskLines}`,
  ];
  return parts.filter(Boolean).join("\n\n");
}

export function portfolioContext(projects: StudioProjectView[]) {
  const active = projects.filter((project) => !CLOSED_STATUSES.has(project.status));
  return active.map((project) => projectContext(project)).join("\n\n---\n\n");
}

export const COPILOT_ACTIONS = [
  { id: "from_message", label: "Parse WhatsApp / email", hint: "Turn a client message into next steps and tasks." },
  { id: "break_down", label: "Break down project", hint: "Generate a task list from the selected project." },
  { id: "today", label: "Focus today", hint: "Prioritise open work across active projects." },
  { id: "client_update", label: "Draft client update", hint: "Write a progress email for the selected project." },
  { id: "quote_scope", label: "Scope a quote", hint: "Deliverables, timeline, and questions to ask." },
  { id: "triage", label: "Triage enquiry", hint: "Summarise a new enquiry and flag gaps." },
  { id: "deadline", label: "Deadline prep", hint: "What is realistic before the deadline, plus a client note." },
  { id: "briefing", label: "Morning briefing", hint: "Priorities, risks, and quick wins from current projects." },
  { id: "generate_diagram", label: "Diagram", hint: "Mermaid flowchart, sequence, or sitemap." },
  { id: "video_script", label: "Video script", hint: "Shot list, on-screen text, and voiceover." },
  { id: "freeform", label: "Ask anything", hint: "Draft a message or ask a follow-up." },
] as const;

export type CopilotAction = (typeof COPILOT_ACTIONS)[number]["id"];

const SYSTEM = `You are a freelance project copilot for a developer who builds websites and apps.
Be concise, practical, and action-oriented. Use British English.
When an action asks for tasks as JSON, respond with valid JSON:
{"tasks": [{"title": "...", "description": "...", "priority": "high|medium|low", "due_in_days": 3}]}
Otherwise respond in clear markdown.`;

const FREEFORM = `You are a freelance business assistant. Reply in markdown, British English, warm but professional.
Write the message the user can paste. Do not output JSON unless they explicitly ask for tasks.`;

const ACTION_PROMPTS: Record<string, string> = {
  break_down: "Break this project into a clear task list. Return ONLY JSON with the tasks format specified.",
  today: "Based on the active projects and tasks, say exactly what to focus on today. Be specific.",
  client_update: "Draft a short, friendly client update email from the project status. Professional and warm.",
  quote_scope: "Scope this enquiry into deliverables, a rough timeline, and questions to ask before quoting.",
  from_message:
    "This came from a WhatsApp or email message. Extract intent, requirements, deadlines, and next steps. Then create a task list as JSON.",
  generate_diagram:
    "Create a Mermaid diagram. Output a ```mermaid code block and one sentence explaining it.",
  video_script: "Write a video plan: concept, duration, shot list, on-screen text, voiceover, and B-roll.",
  triage:
    "Provide: summary of what they likely need, red flags, questions before quoting, suggested deliverables, and a rough timeline. Then return tasks as JSON.",
  deadline:
    "Prepare: what is realistically achievable before the deadline, a client email (on track or needs an extension), and tasks to prioritise.",
  briefing: `Give a morning briefing:
## Top 3 priorities today
## Client actions needed
## Risks / overdue items
## Quick wins
Base every point on the project data. If discovery notes or a quote are already saved, do not suggest a discovery call. British English. Concise.`,
};

export function copilotSystem(action: string) {
  if (action === "freeform") return FREEFORM;
  if (action === "generate_diagram") {
    return "You create practical Mermaid diagrams for freelance web and app projects. British English labels.";
  }
  return SYSTEM;
}

export function copilotUserContent(action: string, message: string, context: string) {
  const prompt = ACTION_PROMPTS[action] ?? "";
  const body = [prompt, message.trim()].filter(Boolean).join("\n\n");
  if (!context.trim()) return body;
  return `Context:\n${context}\n\n${body}`;
}

export function extractTasks(text: string): SuggestedTask[] {
  const match = text.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
  if (!match) return [];
  try {
    const data = JSON.parse(match[0]) as {
      tasks?: {
        title?: string;
        description?: string;
        priority?: string;
        due_in_days?: number;
        dueInDays?: number;
      }[];
    };
    if (!Array.isArray(data.tasks)) return [];
    return data.tasks
      .filter((task) => typeof task?.title === "string" && task.title.trim())
      .map((task) => ({
        title: task.title!.trim(),
        description: typeof task.description === "string" ? task.description : "",
        priority: TASK_PRIORITIES.includes(task.priority as (typeof TASK_PRIORITIES)[number])
          ? task.priority
          : "medium",
        dueInDays: typeof task.due_in_days === "number" ? task.due_in_days : task.dueInDays,
      }));
  } catch {
    return [];
  }
}

export function cleanFreeform(text: string) {
  return text
    .replace(/\{[\s\S]*?"tasks"[\s\S]*?\}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function dueDateFromDays(days: number | undefined) {
  if (typeof days !== "number" || !Number.isFinite(days)) return "";
  const date = new Date();
  date.setDate(date.getDate() + Math.round(days));
  return date.toISOString().slice(0, 10);
}
