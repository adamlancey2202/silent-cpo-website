import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadStudio, runCopilot } from "@/lib/studio-copilot";
import {
  buildDashboard,
  computeNudges,
  COPILOT_ACTIONS,
  DISCOVERY_SHEET,
  dueDateFromDays,
  PAYMENT_TYPES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  workflowForType,
  type CopilotAction,
} from "@/lib/studio";

const text = z.string().trim().max(20000);
const optionalText = text.optional();

const projectFields = {
  clientId: z.string().trim().min(1).nullable().optional(),
  title: text.min(1).max(200),
  description: optionalText,
  projectType: z.enum(PROJECT_TYPES).optional(),
  status: z.enum(PROJECT_STATUSES.map((item) => item.id) as [string, ...string[]]).optional(),
  budget: optionalText,
  agreedCost: optionalText,
  amountPaid: optionalText,
  paymentType: z.enum(PAYMENT_TYPES.map((item) => item.id) as [string, ...string[]]).optional(),
  paymentNotes: optionalText,
  deadline: z.string().trim().max(40).optional(),
  notes: optionalText,
  whatDoing: optionalText,
  discoveryFeedback: optionalText,
  quoteText: optionalText,
  quoteFilename: z.string().trim().max(200).optional(),
};

async function snapshot() {
  const { clients, projects } = await loadStudio();
  const looseRows = await db.studioTask.findMany({
    where: { projectId: null },
    orderBy: { createdAt: "desc" },
  });
  const looseTasks = looseRows.map((task) => ({
    id: task.id,
    projectId: null,
    projectTitle: "",
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    phase: task.phase,
    sortOrder: task.sortOrder,
    onTaskList: true,
  }));
  return {
    clients,
    projects,
    looseTasks,
    dashboard: buildDashboard(projects, clients.length, looseTasks),
    nudges: computeNudges(projects),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    actions: COPILOT_ACTIONS,
    discoverySheet: DISCOVERY_SHEET,
  };
}

function blank(value: string | undefined) {
  return value ?? "";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await snapshot());
}

const createSchema = z.discriminatedUnion("entity", [
  z.object({
    entity: z.literal("client"),
    name: text.min(1).max(200),
    email: optionalText,
    phone: optionalText,
    whatsapp: optionalText,
    notes: optionalText,
  }),
  z.object({
    entity: z.literal("project"),
    seedWorkflow: z.boolean().optional(),
    ...projectFields,
  }),
  z.object({
    entity: z.literal("task"),
    projectId: z.string().trim().min(1).nullable().optional(),
    title: text.min(1).max(300),
    description: optionalText,
    status: z.enum(TASK_STATUSES.map((item) => item.id) as [string, ...string[]]).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    dueDate: z.string().trim().max(40).optional(),
    phase: z.string().trim().max(80).optional(),
    onTaskList: z.boolean().optional(),
  }),
  z.object({
    entity: z.literal("seed"),
    projectId: z.string().trim().min(1),
  }),
  z.object({
    entity: z.literal("applyTasks"),
    projectId: z.string().trim().min(1),
    tasks: z
      .array(
        z.object({
          title: text.min(1).max(300),
          description: optionalText,
          priority: z.enum(TASK_PRIORITIES).optional(),
          dueInDays: z.number().int().min(0).max(365).optional(),
        }),
      )
      .min(1)
      .max(40),
  }),
  z.object({
    entity: z.literal("copilot"),
    action: z.enum(COPILOT_ACTIONS.map((item) => item.id) as [CopilotAction, ...CopilotAction[]]),
    message: text.max(12000).optional().default(""),
    projectId: z.string().trim().min(1).optional(),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: text.max(12000),
        }),
      )
      .max(12)
      .optional(),
  }),
]);

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }

  const body = parsed.data;

  if (body.entity === "client") {
    await db.studioClient.create({
      data: {
        name: body.name,
        email: blank(body.email),
        phone: blank(body.phone),
        whatsapp: blank(body.whatsapp),
        notes: blank(body.notes),
      },
    });
    return NextResponse.json(await snapshot());
  }

  if (body.entity === "project") {
    const project = await db.studioProject.create({
      data: {
        clientId: body.clientId || null,
        title: body.title,
        description: blank(body.description),
        projectType: body.projectType ?? "website",
        status: body.status ?? "enquiry",
        budget: blank(body.budget),
        agreedCost: blank(body.agreedCost),
        amountPaid: blank(body.amountPaid),
        paymentType: body.paymentType ?? "money",
        paymentNotes: blank(body.paymentNotes),
        deadline: blank(body.deadline),
        notes: blank(body.notes),
        whatDoing: blank(body.whatDoing),
        discoveryFeedback: blank(body.discoveryFeedback),
        quoteText: blank(body.quoteText),
        quoteFilename: blank(body.quoteFilename),
      },
    });
    if (body.seedWorkflow !== false) {
      const templates = workflowForType(project.projectType);
      await db.studioTask.createMany({
        data: templates.map((task, index) => ({
          projectId: project.id,
          title: task.title,
          phase: task.phase,
          sortOrder: index,
        })),
      });
    }
    return NextResponse.json(await snapshot());
  }

  if (body.entity === "task") {
    const sortOrder = body.projectId
      ? await db.studioTask.count({ where: { projectId: body.projectId } })
      : 0;
    await db.studioTask.create({
      data: {
        projectId: body.projectId || null,
        title: body.title,
        description: blank(body.description),
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        dueDate: blank(body.dueDate),
        phase: blank(body.phase),
        sortOrder,
        onTaskList: body.onTaskList ?? false,
      },
    });
    return NextResponse.json(await snapshot());
  }

  if (body.entity === "seed") {
    const project = await db.studioProject.findUnique({
      where: { id: body.projectId },
      include: { _count: { select: { tasks: true } } },
    });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (project._count.tasks === 0) {
      const templates = workflowForType(project.projectType);
      await db.studioTask.createMany({
        data: templates.map((task, index) => ({
          projectId: project.id,
          title: task.title,
          phase: task.phase,
          sortOrder: index,
        })),
      });
    }
    return NextResponse.json(await snapshot());
  }

  if (body.entity === "applyTasks") {
    const project = await db.studioProject.findUnique({ where: { id: body.projectId } });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const start = await db.studioTask.count({ where: { projectId: project.id } });
    await db.studioTask.createMany({
      data: body.tasks.map((task, index) => ({
        projectId: project.id,
        title: task.title,
        description: blank(task.description),
        priority: task.priority ?? "medium",
        dueDate: dueDateFromDays(task.dueInDays),
        sortOrder: start + index,
      })),
    });
    return NextResponse.json(await snapshot());
  }

  try {
    const { projects } = await loadStudio();
    const result = await runCopilot({
      action: body.action,
      message: body.message,
      projectId: body.projectId,
      history: body.history,
      projects,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Copilot failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

const patchSchema = z.discriminatedUnion("entity", [
  z.object({
    entity: z.literal("client"),
    id: z.string().min(1),
    name: text.min(1).max(200),
    email: optionalText,
    phone: optionalText,
    whatsapp: optionalText,
    notes: optionalText,
  }),
  z.object({
    entity: z.literal("project"),
    id: z.string().min(1),
    ...projectFields,
  }),
  z.object({
    entity: z.literal("task"),
    id: z.string().min(1),
    title: text.min(1).max(300).optional(),
    description: optionalText,
    status: z.enum(TASK_STATUSES.map((item) => item.id) as [string, ...string[]]).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    dueDate: z.string().trim().max(40).optional(),
    phase: z.string().trim().max(80).optional(),
    projectId: z.string().trim().min(1).nullable().optional(),
    onTaskList: z.boolean().optional(),
  }),
]);

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }
  const body = parsed.data;

  if (body.entity === "client") {
    await db.studioClient.update({
      where: { id: body.id },
      data: {
        name: body.name,
        email: blank(body.email),
        phone: blank(body.phone),
        whatsapp: blank(body.whatsapp),
        notes: blank(body.notes),
      },
    });
  } else if (body.entity === "project") {
    await db.studioProject.update({
      where: { id: body.id },
      data: {
        clientId: body.clientId || null,
        title: body.title,
        description: blank(body.description),
        projectType: body.projectType ?? "website",
        status: body.status ?? "enquiry",
        budget: blank(body.budget),
        agreedCost: blank(body.agreedCost),
        amountPaid: blank(body.amountPaid),
        paymentType: body.paymentType ?? "money",
        paymentNotes: blank(body.paymentNotes),
        deadline: blank(body.deadline),
        notes: blank(body.notes),
        whatDoing: blank(body.whatDoing),
        discoveryFeedback: blank(body.discoveryFeedback),
        quoteText: blank(body.quoteText),
        quoteFilename: blank(body.quoteFilename),
      },
    });
  } else {
    await db.studioTask.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate,
        phase: body.phase,
        projectId: body.projectId,
        onTaskList: body.onTaskList,
      },
    });
  }

  return NextResponse.json(await snapshot());
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const id = searchParams.get("id");
  if (!id || (entity !== "client" && entity !== "project" && entity !== "task")) {
    return NextResponse.json({ error: "Missing record." }, { status: 400 });
  }
  if (entity === "client") await db.studioClient.delete({ where: { id } });
  if (entity === "project") await db.studioProject.delete({ where: { id } });
  if (entity === "task") await db.studioTask.delete({ where: { id } });
  return NextResponse.json(await snapshot());
}
