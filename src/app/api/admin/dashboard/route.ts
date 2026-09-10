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

  const [paymentLinks, invoices, contacts, openEnquiries] = await Promise.all([
    db.paymentLink.findMany({ orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({ orderBy: { createdAt: "desc" } }),
    db.contact.findMany({ orderBy: { createdAt: "desc" } }),
    db.contact.count({ where: { status: "new" } }),
  ]);

  const revenue = calculateRevenue({ invoices, paymentLinks });

  return NextResponse.json({
    revenue,
    paymentLinks,
    invoices,
    contacts,
    counts: {
      contacts: contacts.length,
      openEnquiries,
    },
  });
}
