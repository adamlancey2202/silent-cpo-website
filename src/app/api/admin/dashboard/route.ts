import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateRevenue } from "@/lib/revenue";
import { syncPaymentStatuses } from "@/lib/stripe-sync";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncPaymentStatuses();

  const [paymentLinks, invoices, contacts, openEnquiries, subscribers] = await Promise.all([
    db.paymentLink.findMany({ orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({ orderBy: { createdAt: "desc" } }),
    db.contact.findMany({ orderBy: { createdAt: "desc" } }),
    db.contact.count({ where: { status: "new" } }),
    db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        source: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const revenue = calculateRevenue({ invoices, paymentLinks });

  return NextResponse.json({
    revenue,
    paymentLinks,
    invoices,
    contacts,
    subscribers,
    counts: {
      contacts: contacts.length,
      openEnquiries,
    },
  });
}
