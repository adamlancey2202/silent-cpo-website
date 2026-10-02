import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured } from "@/lib/database-url";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";

const signupSchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(100).optional(),
  source: z.string().trim().max(120).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const data = signupSchema.parse(body);

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

    const result = await subscribeToNewsletter({
      email: data.email,
      name: data.name || null,
      source: data.source || null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, already: result.already });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    console.error("Newsletter signup error:", error);
    return NextResponse.json(
      { error: "Could not save your signup. Please try again." },
      { status: 500 }
    );
  }
}
