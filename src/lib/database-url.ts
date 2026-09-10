/** Neon on Vercel often injects POSTGRES_* instead of DATABASE_URL. */
const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
] as const;

export function resolveDatabaseUrl(): string {
  for (const key of URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

/** Call before PrismaClient is created. */
export function ensureDatabaseUrl(): void {
  const resolved = resolveDatabaseUrl();
  if (resolved) {
    process.env.DATABASE_URL = resolved;
  }
}
