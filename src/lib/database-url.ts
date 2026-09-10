/**
 * Neon via Vercel Storage injects standard names OR prefixed names
 * (e.g. silencpo_POSTGRES_PRISMA_URL). Prisma reads POSTGRES_PRISMA_URL.
 */
const STANDARD_KEYS = [
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL",
] as const;

const POOLED_SUFFIXES = [
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL",
] as const;

function isPostgresUrl(value: string): boolean {
  return /^postgres(ql)?:\/\//i.test(value.trim());
}

function findPrefixedUrl(suffix: string): string | undefined {
  const needle = `_${suffix}`;
  for (const [key, value] of Object.entries(process.env)) {
    const trimmed = value?.trim();
    if (key.endsWith(needle) && trimmed && isPostgresUrl(trimmed)) {
      return trimmed;
    }
  }
  return undefined;
}

export function resolveDatabaseUrl(): string {
  // Prefixed Neon vars first — never confused with local SQLite DATABASE_URL
  for (const suffix of POOLED_SUFFIXES) {
    const value = findPrefixedUrl(suffix);
    if (value) return value;
  }

  for (const key of STANDARD_KEYS) {
    const value = process.env[key]?.trim();
    if (value && isPostgresUrl(value)) return value;
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
