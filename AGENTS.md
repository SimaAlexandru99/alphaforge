## Learned User Preferences

- The user sometimes writes in Romanian for this project; Romanian responses are acceptable when the user uses Romanian.

## Learned Workspace Facts

- This repo is the AlphaForge hackathon project: autonomous trading agent with Kraken CLI, PRISM signals, LLM decisions, risk checks, Prisma/SQLite, and ERC-8004-related flows on Sepolia; public demo is linked from the README (e.g. Vercel deployment at `alphaforge-rho.vercel.app`).
- If Next.js dev fails with `MODULE_UNPARSABLE` or missing `instrumentation.ts` after the file was removed, clear stale Turbopack output with `pnpm clean` (removes `.next`) and restart `pnpm dev`.
- Vercel serverless cannot keep a long-lived `pnpm worker` process; production agent ticks rely on Vercel Cron hitting `/api/cron/agent-tick`, secured in production with `Authorization: Bearer <CRON_SECRET>` (set `CRON_SECRET` in Vercel project env).
- In local `next dev`, when `CRON_SECRET` is unset, the cron route may allow requests without auth for convenience; production always requires the secret when configured.
- Dashboard worker/heartbeat on Vercel is backed by Prisma (`lastCronHeartbeat` on `AgentConfig`) rather than only file-based runtime state under `/tmp`.
- SQLite on Vercel uses a writable copy under `/tmp` and is ephemeral across instances; a hosted Postgres is the path to fully shared persistent DB state in production.
- Vercel Hobby limits cron frequency (e.g. one cron job per day); the project’s `vercel.json` cron schedule and heartbeat staleness window align with that constraint unless the plan allows tighter schedules.
