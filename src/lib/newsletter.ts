import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { sendNewsletterSignupEmails } from "@/lib/mailersend";

export type SubscribeInput = {
  email: string;
  name?: string | null;
  source?: string | null;
};

export async function subscribeToNewsletter(input: SubscribeInput): Promise<
  | { ok: true; already: boolean }
  | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || null;
  const source = input.source?.trim() || null;

  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.status === "subscribed") {
    return { ok: true, already: true };
  }

  try {
    if (existing) {
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { name, source, status: "subscribed" },
      });
    } else {
      await db.newsletterSubscriber.create({
        data: {
          email,
          name,
          source,
          unsubscribeToken: randomBytes(24).toString("hex"),
        },
      });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: true, already: true };
    }
    throw error;
  }

  const subscriber = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (!subscriber) return { ok: false, error: "Could not save signup" };

  const emailResult = await sendNewsletterSignupEmails({
    email: subscriber.email,
    name: subscriber.name,
    source: subscriber.source,
    unsubscribeToken: subscriber.unsubscribeToken,
  });
  if (!emailResult.ok) {
    console.warn("[Newsletter] signup saved but email not sent:", emailResult.error);
  }

  return { ok: true, already: false };
}

export async function unsubscribeByToken(
  token: string
): Promise<"done" | "already" | "invalid"> {
  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!subscriber) return "invalid";
  if (subscriber.status === "unsubscribed") return "already";

  await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { status: "unsubscribed" },
  });
  return "done";
}
