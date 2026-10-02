import { db } from "@/lib/db";
import {
  cleanFreeform,
  copilotSystem,
  copilotUserContent,
  extractTasks,
  portfolioContext,
  projectContext,
  type CopilotAction,
  type StudioProjectView,
} from "@/lib/studio";

type Turn = { role: "user" | "assistant"; content: string };

export async function runCopilot(input: {
  action: CopilotAction;
  message: string;
  projectId?: string;
  history?: Turn[];
  projects: StudioProjectView[];
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Set OPENAI_API_KEY to use the copilot.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const project = input.projectId
    ? input.projects.find((item) => item.id === input.projectId)
    : undefined;

  let context = "";
  if (input.action === "today" || input.action === "briefing") {
    context = portfolioContext(input.projects);
  } else if (project) {
    context = projectContext(project);
  }

  const history = (input.history ?? [])
    .filter((turn) => (turn.role === "user" || turn.role === "assistant") && turn.content.trim())
    .slice(-12)
    .map((turn) => ({ role: turn.role, content: turn.content }));

  const includeContext = input.action !== "freeform" || history.length === 0;
  const userContent = copilotUserContent(input.action, input.message, includeContext ? context : "");
  const messages = [
    ...history,
    { role: "user" as const, content: userContent },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [{ role: "system", content: copilotSystem(input.action) }, ...messages],
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 280);
    throw new Error(`OpenAI request failed (${response.status}). ${detail}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content?.trim() ?? "";
  const text = input.action === "freeform" ? cleanFreeform(raw) : raw;

  return {
    response: text,
    tasks: input.action === "freeform" ? [] : extractTasks(text),
    model,
    projectId: project?.id ?? null,
  };
}

export async function loadStudio() {
  const [clients, projects] = await Promise.all([
    db.studioClient.findMany({ orderBy: { name: "asc" } }),
    db.studioProject.findMany({
      include: {
        client: { select: { name: true } },
        tasks: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const views: StudioProjectView[] = projects.map((project) => ({
    id: project.id,
    clientId: project.clientId,
    clientName: project.client?.name ?? "",
    title: project.title,
    description: project.description,
    projectType: project.projectType,
    status: project.status,
    budget: project.budget,
    agreedCost: project.agreedCost,
    amountPaid: project.amountPaid,
    paymentType: project.paymentType,
    paymentNotes: project.paymentNotes,
    deadline: project.deadline,
    notes: project.notes,
    whatDoing: project.whatDoing,
    discoveryFeedback: project.discoveryFeedback,
    quoteText: project.quoteText,
    quoteFilename: project.quoteFilename,
    createdAt: project.createdAt.toISOString(),
    tasks: project.tasks.map((task) => ({
      id: task.id,
      projectId: task.projectId,
      projectTitle: project.title,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      phase: task.phase,
      sortOrder: task.sortOrder,
    })),
  }));

  return {
    clients: clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      whatsapp: client.whatsapp,
      notes: client.notes,
    })),
    projects: views,
  };
}
