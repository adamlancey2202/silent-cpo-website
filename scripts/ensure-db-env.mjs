/**
 * Neon on Vercel injects POSTGRES_* vars — Prisma expects DATABASE_URL.
 * Usage: node scripts/ensure-db-env.mjs prisma generate
 */
import { spawnSync } from "node:child_process";

const URL_KEYS = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];

function ensureDbEnv() {
  if (process.env.DATABASE_URL?.trim()) return;
  for (const key of URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      process.env.DATABASE_URL = value;
      return;
    }
  }
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
