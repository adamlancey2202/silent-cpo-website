import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/database-url";
import { unsubscribeByToken } from "@/lib/newsletter";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "").trim();
  const redirectTo = (status: string) => {
    const url = new URL("/newsletter/unsubscribe", request.url);
    url.searchParams.set("status", status);
    return NextResponse.redirect(url, 303);
  };

  if (!token || !isDatabaseConfigured()) {
    return redirectTo("invalid");
  }

  try {
    const status = await unsubscribeByToken(token);
    return redirectTo(status);
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return redirectTo("invalid");
  }
}
