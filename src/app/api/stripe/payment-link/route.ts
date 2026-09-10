import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const schema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  amount: z.number().int().positive(),
  currency: z.string().default("gbp"),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const data = schema.parse(body);
    const stripe = getStripe();

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: data.currency,
            product_data: {
              name: data.description ?? `Payment for ${data.customerName}`,
            },
            unit_amount: data.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
      },
      after_completion: {
        type: "hosted_confirmation",
        hosted_confirmation: {
          custom_message: "Thank you for your payment — SilentCPO",
        },
      },
    });

    const record = await db.paymentLink.create({
      data: {
        stripeId: paymentLink.id,
        url: paymentLink.url,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
      },
    });

    return NextResponse.json({
      id: record.id,
      url: paymentLink.url,
      stripeId: paymentLink.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Payment link error:", error);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 }
    );
  }
}
