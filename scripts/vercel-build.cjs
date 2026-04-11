/**
 * Vercel build entry: migrate → optional seed → next build.
 * Skips seed-demo on Vercel (any VERCEL=1 env) unless SEED_DEMO_ON_BUILD=true,
 * so Production/Preview deploys don’t wipe Trade/AgentRun when they share a DB.
 */
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "inherit", cwd: root, env: process.env });
}

run("pnpm", ["exec", "prisma", "migrate", "deploy"]);

const onVercel = process.env.VERCEL === "1";
const forceSeed = process.env.SEED_DEMO_ON_BUILD === "true";

if (onVercel && !forceSeed) {
  console.log(
    "[vercel-build] Skipping scripts/seed-demo.ts on Vercel (set SEED_DEMO_ON_BUILD=true for one-shot seed)."
  );
} else {
  run("pnpm", ["exec", "tsx", "scripts/seed-demo.ts"]);
}

run("pnpm", ["run", "build"]);
