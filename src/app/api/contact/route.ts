import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendContactNotification } from "@/lib/mailersend";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  project: z.string().min(1),
  budget: z.string().optional(),
  message: z.string().min(10).max(5000),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    if (isTurnstileConfigured()) {
      if (!data.turnstileToken) {
        return NextResponse.json(
          { error: "Security verification required" },
          { status: 400 }
        );
      }

      const ip =
        request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

      const valid = await verifyTurnstileToken(data.turnstileToken, ip);
      if (!valid) {
        return NextResponse.json(
          { error: "Security verification failed. Please try again." },
          { status: 403 }
        );
      }
    }

    const contact = await db.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        project: data.project,
        budget: data.budget,
        message: data.message,
      },
    });

    const emailResult = await sendContactNotification({
      name: data.name,
      email: data.email,
      phone: data.phone,
      project: data.project,
      budget: data.budget,
      message: data.message,
    });

    if (!emailResult.ok) {
      console.warn("[Contact] enquiry saved but email not sent:", emailResult.error);
    }

    return NextResponse.json({ success: true, id: contact.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to submit message" },
      { status: 500 }
    );
  }
}
