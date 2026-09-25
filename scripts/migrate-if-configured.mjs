/**
 * Run prisma migrate deploy when a Postgres URL is available.
 * Skips silently during builds with no database configured.
 * Baselines existing Neon schemas that predate migration history (P3005).
 */
import { spawnSync } from "node:child_process";
import {
  loadEnvFile,
  resolveDirectUrl,
  resolvePooledUrl,
} from "./ensure-db-env.mjs";

function runPrisma(args) {
  return spawnSync("npx", ["prisma", ...args], {
    stdio: "pipe",
    env: process.env,
    encoding: "utf8",
  });
}

function applyDbEnv() {
  loadEnvFile(".env");
  loadEnvFile(".env.local", true);

  const pooled = resolvePooledUrl();
  if (!pooled) return false;

  const url = resolveDirectUrl() || pooled;
  process.env.POSTGRES_PRISMA_URL = url;
  process.env.DATABASE_URL = url;
  return true;
}

function output(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

if (!applyDbEnv()) {
  console.log("Skipping prisma migrate deploy — no Postgres database URL configured.");
  process.exit(0);
}

let result = runPrisma(["migrate", "deploy"]);
output(result);

if (result.status === 0) {
  process.exit(0);
}

const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
if (combined.includes("P3005")) {
  console.log("Database already has tables — baselining initial migration…");
  const baseline = runPrisma([
    "migrate",
    "resolve",
    "--applied",
    "20240910120000_init",
  ]);
  output(baseline);

  if (baseline.status !== 0) {
    process.exit(baseline.status ?? 1);
  }

  result = runPrisma(["migrate", "deploy"]);
  output(result);
}

process.exit(result.status ?? 1);
