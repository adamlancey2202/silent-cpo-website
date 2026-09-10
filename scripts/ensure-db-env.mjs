/**
 * Load .env files, resolve Neon URL (incl. silencpo_* prefix), run Prisma.
 * Schema changes use the direct (non-pooled) URL — required by Neon for DDL.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const POOLED_SUFFIXES = ["POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL"];
const POOLED_KEYS = ["POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL"];
const DIRECT_SUFFIXES = ["POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED"];
const DIRECT_KEYS = ["POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED"];

function isPostgresUrl(value) {
  return /^postgres(ql)?:\/\//i.test(value.trim());
}

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

function findPrefixedUrl(suffixes) {
  for (const suffix of suffixes) {
    const needle = `_${suffix}`;
    for (const [key, value] of Object.entries(process.env)) {
      const trimmed = value?.trim();
      if (key.endsWith(needle) && trimmed && isPostgresUrl(trimmed)) {
        return trimmed;
      }
    }
  }
  return undefined;
}

function resolvePooledUrl() {
  const prefixed = findPrefixedUrl(POOLED_SUFFIXES);
  if (prefixed) return prefixed;

  for (const key of POOLED_KEYS) {
    const value = process.env[key]?.trim();
    if (value && isPostgresUrl(value)) return value;
  }
  return "";
}

function resolveDirectUrl() {
  const prefixed = findPrefixedUrl(DIRECT_SUFFIXES);
  if (prefixed) return prefixed;

  for (const key of DIRECT_KEYS) {
    const value = process.env[key]?.trim();
    if (value && isPostgresUrl(value)) return value;
  }

  return resolvePooledUrl();
}

function isSchemaCommand(args) {
  const joined = args.join(" ");
  return /\b(push|migrate)\b/.test(joined);
}

function ensureDbEnv(args) {
  loadEnvFile(".env");
  loadEnvFile(".env.local", true);

  const pooled = resolvePooledUrl();
  if (!pooled) return false;

  const url = isSchemaCommand(args) ? resolveDirectUrl() : pooled;
  process.env.POSTGRES_PRISMA_URL = url;
  process.env.DATABASE_URL = url;
  return true;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  ensureDbEnv(args);
  process.exit(0);
}

if (!ensureDbEnv(args)) {
  console.error(`
No Postgres database URL found.

Tables are created automatically on Vercel deploy.
For local setup: vercel link && vercel env pull .env.local && npm run db:deploy
`);
  process.exit(1);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
