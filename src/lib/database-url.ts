/** Neon on Vercel injects POSTGRES_* — sync all names Prisma/tools may read. */
const URL_KEYS = [
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL",
] as const;

export function resolveDatabaseUrl(): string {
  for (const key of URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

/** Call before PrismaClient is created or Prisma CLI runs. */
export function ensureDatabaseUrl(): void {
  const resolved = resolveDatabaseUrl();
  if (!resolved) return;

  process.env.POSTGRES_PRISMA_URL = resolved;
  process.env.DATABASE_URL = resolved;
}

export function isDatabaseConfigured(): boolean {
  ensureDatabaseUrl();
  return Boolean(resolveDatabaseUrl());
}
