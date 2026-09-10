/**
 * Neon on Vercel injects POSTGRES_* vars — Prisma expects DATABASE_URL.
 * Usage: node scripts/ensure-db-env.mjs prisma generate
 */
import { spawnSync } from "node:child_process";

const URL_KEYS = ["POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL"];

function ensureDbEnv() {
  for (const key of URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      process.env.POSTGRES_PRISMA_URL = value;
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
