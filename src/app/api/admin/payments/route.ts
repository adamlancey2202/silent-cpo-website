import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [paymentLinks, invoices] = await Promise.all([
    db.paymentLink.findMany({ orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({ paymentLinks, invoices });
}
