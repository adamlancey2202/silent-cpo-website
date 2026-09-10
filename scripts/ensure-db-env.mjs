/**
 * Resolve Neon DB URL (including Vercel Storage prefixes like silencpo_*).
 * Usage: node scripts/ensure-db-env.mjs prisma generate
 */
import { spawnSync } from "node:child_process";

const STANDARD_KEYS = ["POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL"];
const PREFIXED_SUFFIXES = ["POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL"];

function findPrefixedUrl(suffix) {
  const needle = `_${suffix}`;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith(needle) && value?.trim()) return value.trim();
  }
  return undefined;
}

function resolveDatabaseUrl() {
  for (const key of STANDARD_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  for (const suffix of PREFIXED_SUFFIXES) {
    const value = findPrefixedUrl(suffix);
    if (value) return value;
  }
  return "";
}

function ensureDbEnv() {
  const resolved = resolveDatabaseUrl();
  if (!resolved) return;
  process.env.POSTGRES_PRISMA_URL = resolved;
  process.env.DATABASE_URL = resolved;
}

const args = process.argv.slice(2);
ensureDbEnv();

if (args.length === 0) {
  process.exit(0);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
