/**
 * Map Neon/Vercel env vars, then run a command with those vars applied.
 * Usage: node scripts/ensure-db-env.mjs prisma generate
 */
import { spawnSync } from "node:child_process";

function ensureDbEnv() {
  if (!process.env.DATABASE_URL?.trim()) {
    const pooled =
      process.env.POSTGRES_PRISMA_URL?.trim() ||
      process.env.POSTGRES_URL?.trim();
    if (pooled) process.env.DATABASE_URL = pooled;
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
