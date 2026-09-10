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
  daysUntilDue: z.number().int().positive().default(14),
  sendEmail: z.boolean().default(true),
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

    const customers = await stripe.customers.list({
      email: data.customerEmail,
      limit: 1,
    });

    const customer =
      customers.data[0] ??
      (await stripe.customers.create({
        email: data.customerEmail,
        name: data.customerName,
      }));

    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: data.amount,
      currency: data.currency,
      description: data.description ?? "SilentCPO — Digital Product Services",
    });

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: data.daysUntilDue,
      auto_advance: true,
    });

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    if (data.sendEmail) {
      await stripe.invoices.sendInvoice(finalized.id);
    }

    const record = await db.invoice.create({
      data: {
        stripeId: finalized.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        status: finalized.status ?? "open",
        hostedUrl: finalized.hosted_invoice_url,
        pdfUrl: finalized.invoice_pdf,
      },
    });

    return NextResponse.json({
      id: record.id,
      stripeId: finalized.id,
      hostedUrl: finalized.hosted_invoice_url,
      pdfUrl: finalized.invoice_pdf,
      status: finalized.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Invoice error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
