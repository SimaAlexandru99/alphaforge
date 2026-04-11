/**
 * Push local `.env` to Vercel Production (non-interactive).
 * - Forces KRAKEN_CLI_SIMULATE=true (Kraken CLI binary is not on Vercel serverless).
 * - Appends CRON_SECRET to `.env` if missing (required for /api/cron/agent-tick in production).
 *
 * Usage: pnpm vercel:env
 * Requires: `vercel link`, logged-in CLI.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const dotenv = require("dotenv");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");

if (!fs.existsSync(envPath)) {
  console.error("[sync-vercel-env] Missing .env — create it from .env.example");
  process.exit(1);
}

const parsed = dotenv.parse(fs.readFileSync(envPath, "utf8"));

if (!parsed.CRON_SECRET?.trim()) {
  const secret = crypto.randomBytes(24).toString("hex");
  parsed.CRON_SECRET = secret;
  fs.appendFileSync(
    envPath,
    `\n# Added by sync-vercel-production-env.cjs\nCRON_SECRET="${secret}"\n`
  );
  console.log("[sync-vercel-env] Appended CRON_SECRET to .env (keep it secret).");
}

parsed.KRAKEN_CLI_SIMULATE = "true";

const dbUrl =
  parsed.DATABASE_URL?.trim() ||
  parsed.STORAGE_PRISMA_DATABASE_URL?.trim() ||
  parsed.STORAGE_POSTGRES_URL?.trim() ||
  "";
if (dbUrl) {
  parsed.DATABASE_URL = dbUrl;
}

function isSensitive(name) {
  return /SECRET|_KEY$|PRIVATE|PASSWORD|API_SECRET|RPC_URL|^DATABASE_URL$|^STORAGE_/i.test(
    name
  );
}

console.log("[sync-vercel-env] Pushing to Vercel Production (values not printed)…");

for (const [name, value] of Object.entries(parsed)) {
  if (value === undefined || value === null) continue;
  const str = String(value);
  if (str === "" && name !== "CRON_SECRET") continue;

  const args = [
    "env",
    "add",
    name,
    "production",
    "--value",
    str,
    "--yes",
    "--force",
  ];
  if (isSensitive(name)) {
    args.push("--sensitive");
  }

  try {
    execFileSync("vercel", args, {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"],
      encoding: "utf8",
    });
    console.log("[sync-vercel-env] ok:", name);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error("[sync-vercel-env] fail:", name, err);
    process.exitCode = 1;
  }
}

if (process.exitCode === 1) {
  console.error("[sync-vercel-env] Some variables failed. Fix errors and re-run.");
} else {
  console.log("[sync-vercel-env] Done. Redeploy: vercel deploy --prod --yes");
}
