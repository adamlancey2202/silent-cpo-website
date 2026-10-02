import { timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError, json, readBody } from "@/lib/content/http";
import { budgetInGbp } from "@/lib/gbp";
import { canonicalLeadUrl, projectBatch } from "@/lib/project-leads";

function allowed(request: Request) {
  const expected = process.env.N8N_CONTENT_TOKEN;
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!allowed(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const parsed = projectBatch.safeParse(await readBody(request));
    if (!parsed.success) {
      return json(
        { error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") },
        400
      );
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const pick of parsed.data.picks) {
      const url = canonicalLeadUrl(pick.url);
      const existing = await db.projectLead.findUnique({ where: { url } });
      const data = {
        url,
        source: pick.source,
        title: pick.title,
        excerpt: pick.excerpt,
        budget: await budgetInGbp(pick.budget),
      };
      if (!existing) {
        await db.projectLead.create({ data });
        created += 1;
        continue;
      }
      if (existing.status !== "new") {
        skipped += 1;
        continue;
      }
      await db.projectLead.update({ where: { id: existing.id }, data });
      updated += 1;
    }

    return json({ created, updated, skipped });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return json({ error: "A listing with that URL was saved at the same time. Run the workflow again." }, 409);
    }
    return apiError(error);
  }
}
