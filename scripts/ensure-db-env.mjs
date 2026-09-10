/**
 * Load .env files, resolve Neon URL (incl. silencpo_* prefix), run Prisma.
 * Usage: node scripts/ensure-db-env.mjs prisma db push
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const STANDARD_KEYS = ["POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL"];
const PREFIXED_SUFFIXES = ["POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL"];

function loadEnvFile(filename, override = false) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!override && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

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
  loadEnvFile(".env");
  loadEnvFile(".env.local", true);

  const resolved = resolveDatabaseUrl();
  if (!resolved) return false;

  process.env.POSTGRES_PRISMA_URL = resolved;
  process.env.DATABASE_URL = resolved;
  return true;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  ensureDbEnv();
  process.exit(0);
}

if (!ensureDbEnv()) {
  console.error(`
No database URL found.

  vercel env pull .env.local
  npm run db:deploy

(Neon vars look like silencpo_POSTGRES_PRISMA_URL in .env.local)
`);
  process.exit(1);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
