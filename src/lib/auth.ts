import { timingSafeEqual } from "crypto";
import { headers } from "next/headers";

export function verifyAdminSecret(provided: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !provided) return false;

  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<boolean> {
  const headersList = await headers();
  const auth = headersList.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return verifyAdminSecret(auth.slice(7));
}
