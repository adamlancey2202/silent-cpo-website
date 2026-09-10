import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildPlatformDashboard } from "@/lib/platform-providers-status";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = buildPlatformDashboard();
  return NextResponse.json({
    providers,
    configuredCount: providers.filter((p) => p.configured).length,
    totalCount: providers.length,
  });
}
