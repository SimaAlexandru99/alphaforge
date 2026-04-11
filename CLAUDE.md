# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start Next.js dev server on port 4000
pnpm worker       # Run the agent loop (separate process)
pnpm build        # Production build
pnpm lint         # Biome lint check (ultracite check)
pnpm format       # Biome auto-fix (ultracite fix)
pnpm test         # Run Vitest tests
pnpm test:watch   # Vitest watch mode

pnpm prisma:generate   # Regenerate Prisma client after schema changes
pnpm db:migrate        # Create and apply migration
pnpm db:push           # Push schema without migration (dev shortcut)
```

Run a single test file: `pnpm vitest run tests/path/to/file.test.ts`

**Vercel build** (from `vercel.json`): `node scripts/vercel-build.cjs` → `prisma migrate deploy`, optional `seed-demo` only if `SEED_DEMO_ON_BUILD=true`, then `next build`, against **`DATABASE_URL`** (PostgreSQL). Set `DATABASE_URL` or Prisma Postgres `STORAGE_*` env vars on Vercel.

## Architecture

This is an AI trading agent dashboard. The system has two runtime modes:
1. **Next.js web app** — dashboard UI + REST API (Vercel serverless)
2. **Worker process** (`pnpm worker` / `scripts/worker.ts`) — the agent loop that continuously polls PRISM signals and makes trade decisions

### Core data flow

```
PRISM API → lib/agent/loop.ts → lib/agent/decision.ts → lib/agent/risk.ts
                                                              ↓
                                              lib/kraken/cli.ts (paper/live trade)
                                                              ↓
                                                  Prisma SQLite (AgentRun, Trade)
                                                              ↓
                                          lib/onchain/ (ERC-8004 attestation on Sepolia)
```

### Key layers

**`lib/agent/`** — Agent engine
- `loop.ts`: Main polling loop iterating over configured symbols
- `decision.ts`: Buy/sell/hold logic (heuristic or LLM-based via `LLM_PROVIDER`)
- `risk.ts`: Risk gate applied before every execution
- `config.ts`: Reads/writes `AgentConfig` from DB

**`lib/kraken/`** — Exchange integration via a CLI wrapper (not HTTP). `KRAKEN_CLI_SIMULATE=true` runs locally without credentials.

**`lib/prism/`** — PRISM market signals client. Returns RSI, trend, volatility, risk score per symbol.

**`lib/onchain/`** — ERC-8004 agent identity on Sepolia testnet using viem. Handles registration (`scripts/register-agent.ts`) and trade attestations.

**`lib/server/dashboard.ts`** — Aggregates data for server-rendered dashboard pages.

**`lib/runtime-store.ts`** — Worker PID/heartbeat file state locally; on Vercel, cron heartbeat is stored on `AgentConfig.lastCronHeartbeat`.

**`app/api/`** — REST endpoints:
- `POST /api/agent/start|stop` — spawn/kill worker process
- `GET /api/agent/status|config` — worker state and config
- `POST /api/kraken/execute` — execute a single trade
- `GET /api/market/signals` — latest PRISM signals

### Database

Prisma ORM with **PostgreSQL** (`@prisma/adapter-pg` + `pg`). Schema at `prisma/schema.prisma`; datasource URL is configured in `prisma.config.ts` (`DATABASE_URL` or `STORAGE_PRISMA_DATABASE_URL` / `STORAGE_POSTGRES_URL`). Key models: `AgentConfig`, `SignalSnapshot`, `AgentRun`, `Trade`. Generated client lives in `lib/generated/prisma/`.

After editing `prisma/schema.prisma`, always run `pnpm prisma:generate`.

### Environment variables

See `.env.example`. Key groups:
- **Kraken**: `KRAKEN_API_KEY`, `KRAKEN_API_SECRET`, `KRAKEN_CLI_PATH`, `KRAKEN_CLI_SIMULATE`
- **PRISM**: `PRISM_API_KEY`
- **LLM**: `LLM_PROVIDER`, `LLM_MODEL`, `OPENAI_API_KEY`
- **Onchain**: `AGENT_PRIVATE_KEY`, `AGENT_WALLET_ADDRESS`, `ERC8004_AGENT_ID`, `SEPOLIA_RPC_URL`
- **DB**: `DATABASE_URL` (defaults to `file:./prisma/dev.db`)
- **Mode**: `TRADING_MODE` (`paper` or `live`)

All env vars are parsed and typed via `lib/env.ts`.

## Tech stack

- **Next.js 16** App Router, React 19, TypeScript strict
- **Prisma v7** + `@prisma/adapter-pg` / `pg`
- **Tailwind CSS 4**, shadcn/ui components in `components/ui/`
- **Vitest** for tests (`tests/` directory)
- **Biome** via Ultracite for lint/format (`biome.json` extends `ultracite/biome/next`)
- **viem** for EVM interactions
- **pnpm** as package manager
