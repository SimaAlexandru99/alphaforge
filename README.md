# AlphaForge

AlphaForge is an AI trading agent built for hackathon use cases, combining market signals, LLM decision-making, risk controls, paper trading execution, and ERC-8004 on-chain identity.

## What it does

Every cycle, the agent:

- fetches market signals from PRISM,
- sends the current market + portfolio context to an LLM,
- applies strict risk checks,
- executes a paper trade through Kraken CLI,
- stores everything in SQLite via Prisma,
- optionally posts attestations and feedback on Sepolia through ERC-8004 flows.

## Architecture

```text
Next.js Dashboard
  ├─ UI pages
  ├─ API routes
  └─ agent controls

Agent Loop
  ├─ PRISM market signals
  ├─ LLM decision engine
  ├─ risk engine
  ├─ Kraken paper execution
  └─ SQLite persistence

On-chain Layer
  └─ ERC-8004 identity / validation / reputation on Sepolia
```

## Main flows

### 1. Market intelligence

The app pulls live market context from PRISM, including price, momentum, and risk-related signals.

### 2. AI decision engine

The agent sends structured input to the LLM and expects a constrained output like:

- `BUY`
- `SELL`
- `HOLD`

Each decision also includes confidence and reasoning.

### 3. Risk enforcement

Before any execution, the agent applies hard guardrails:

- stop-loss,
- take-profit,
- max exposure,
- duplicate position prevention.

### 4. Trade execution

If the action passes the risk engine, AlphaForge executes a paper trade through Kraken CLI.

### 5. Persistence

Trades, runs, and config are saved locally with Prisma + SQLite.

### 6. On-chain reputation

The agent can publish identity and trading-related attestations to Sepolia using ERC-8004-compatible flows.

## App routes

- `/` → live dashboard
- `/trades` → trade history
- `/signals` → market signals
- `/agent` → agent configuration

## API routes

- `POST /api/agent/start`
- `POST /api/agent/stop`
- `GET /api/agent/status`
- `POST /api/kraken/execute`
- `GET /api/market/signals`

## Project structure

```text
app/
  agent/
  api/
  signals/
  trades/

components/
  agent/
  charts/
  dashboard/
  navigation/
  ui/

lib/
  agent/
  kraken/
  onchain/
  prism/
  prisma.ts
  env.ts
  runtime-store.ts

prisma/
  schema.prisma
  migrations/

scripts/
  register-agent.ts
  check-balance.ts
  check-trades.ts
  worker.ts
```

## Tech stack

- Next.js
- React
- Tailwind CSS
- shadcn/ui
- Prisma
- SQLite
- OpenAI
- PRISM API
- Kraken CLI
- viem
- Sepolia

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment file

Create `.env.local` and add your local values.

Example:

```env
DATABASE_URL="file:./prisma/dev.db"
TRADING_MODE="paper"

KRAKEN_API_KEY=""
KRAKEN_API_SECRET=""
KRAKEN_CLI_PATH=""
KRAKEN_CLI_SIMULATE="true"

PRISM_API_KEY=""

OPENAI_API_KEY=""
LLM_PROVIDER="openai"
LLM_MODEL="gpt-4o-mini"

AGENT_PRIVATE_KEY=""
AGENT_WALLET_ADDRESS=""
BASE_SEPOLIA_RPC=""
SEPOLIA_RPC_URL=""
```

### 3. Run Prisma

```bash
pnpm prisma migrate dev
```

### 4. Start the app

```bash
pnpm dev
```

Open `http://localhost:4000`.

## Demo flow

1. Start the app.
2. Open `/agent`.
3. Start the worker.
4. Watch signals update.
5. Let the loop generate a decision.
6. Inspect trades in `/trades`.
7. Show persisted data and on-chain registration.

## ERC-8004 identity

| Field | Value |
|---|---|
| Agent ID | `45` |
| Network | Ethereum Sepolia (chainId 11155111) |
| Wallet | `0x34A0aC099E6812701e970024fff89aDDb95c4426` |
| Registration TX | [`0x97a063...`](https://sepolia.etherscan.io/tx/0x97a063dac84108e8eaa578f1e6ddc79bb6cd6a6a259792a20f49c6ed79253eeb) |
| Agent card | [`/agent-registration.json`](./public/agent-registration.json) |

Contracts (Sepolia):

| Contract | Address |
|---|---|
| AgentRegistry | `0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3` |
| HackathonVault | `0x0E7CD8ef9743FEcf94f9103033a044caBD45fC90` |
| RiskRouter | `0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC` |
| ReputationRegistry | `0x423a9904e39537a9997fbaF0f220d79D7d545763` |
| ValidationRegistry | `0x92bF63E5C7Ac6980f237a7164Ab413BE226187F1` |

## Hackathon highlights

- AI-driven trading decisions
- strict risk engine before execution
- paper trading flow through Kraken CLI
- local persistence for reproducible demo
- ERC-8004 identity / validation / reputation integration
- clean dashboard for live inspection

## Safety notes

- This project is configured for paper trading during demos.
- Never commit real secrets.
- Never reuse exposed private keys.
- Use fresh credentials before any public demo or deployment.

## Submission checklist

- [ ] `.env.local` is not committed
- [ ] `.env.example` is included
- [ ] `dev.db` is ignored
- [ ] agent registration JSON is available in `public/`
- [ ] README includes demo steps
- [ ] screenshots or GIF added before final submission

## License

MIT
