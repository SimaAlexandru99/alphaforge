# AlphaForge — Autonomous AI Trading Agent

An autonomous crypto trading agent with on-chain ERC-8004 identity, built for the **Kraken x ERC-8004 Hackathon**.

## What it does

AlphaForge watches BTC/ETH markets every 30 seconds, uses AI to make trading decisions, and executes paper trades on Kraken — all while maintaining a verifiable on-chain identity on Ethereum Sepolia.

```
PRISM API (signals) → GPT-4o-mini (decision) → Risk Engine → Kraken CLI (paper trade)
                                                           ↓
                                              Sepolia: ERC-8004 TradeIntent + Attestation
```

## Live demo

> Dashboard: [deploy to Vercel and add URL here]

## ERC-8004 Identity

| Field | Value |
|---|---|
| Agent ID | **45** |
| Network | Ethereum Sepolia (chainId 11155111) |
| Registration TX | [`0x97a063...`](https://sepolia.etherscan.io/tx/0x97a063dac84108e8eaa578f1e6ddc79bb6cd6a6a259792a20f49c6ed79253eeb) |
| Agent Card | [`/agent-registration.json`](./public/agent-registration.json) |
| Wallet | `0x34A0aC099E6812701e970024fff89aDDb95c4426` |

On every trade, the agent:
1. Signs an EIP-712 `TradeIntent` → submits to `RiskRouter`
2. Posts a checkpoint hash → `ValidationRegistry`
3. Posts a trade outcome score → `ReputationRegistry`

## Architecture

```
┌─────────────────────────────────────────┐
│           Next.js Dashboard             │
│     (live PnL · trades · signals)       │
└──────────────┬──────────────────────────┘
               │ start / stop / status
               ▼
┌─────────────────────────────────────────┐
│         Agent Loop (30s interval)       │
└──────┬──────────────────┬───────────────┘
       │                  │
       ▼                  ▼
  PRISM API          GPT-4o-mini
  (RSI · trend ·     (BUY / SELL
   volatility)        / HOLD)
       │                  │
       └────────┬─────────┘
                ▼
        Risk Engine
        (stop-loss 3%
         take-profit 5%
         max exposure 10%)
                │
       ┌────────┴────────┐
       ▼                 ▼
  Kraken CLI         Sepolia
  paper trade     ERC-8004 on-chain
       │
       ▼
  SQLite (Prisma)
```

## Running locally

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Fill in your keys (see .env.example for details)

# 3. Set up database
pnpm exec prisma migrate dev

# 4. Start dashboard
pnpm dev

# 5. Start agent worker (separate terminal)
pnpm run worker

# Optional: register on-chain (needs Sepolia ETH)
pnpm exec tsx scripts/register-agent.ts
```

## Environment variables

See [`.env.example`](./.env.example) for all required variables with descriptions.

Key variables:
- `KRAKEN_API_KEY` / `KRAKEN_API_SECRET` — Kraken paper trading
- `PRISM_API_KEY` — market signal provider
- `OPENAI_API_KEY` — LLM decisions
- `AGENT_PRIVATE_KEY` — Sepolia wallet for ERC-8004 txs
- `ERC8004_AGENT_ID` — set to `45` after registration

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS, Recharts |
| Backend | Next.js API routes, Node.js worker |
| AI | OpenAI GPT-4o-mini |
| Market data | PRISM API |
| Trading | Kraken CLI v0.3.0 (paper mode) |
| Database | SQLite via Prisma v7 + better-sqlite3 |
| Blockchain | viem, Ethereum Sepolia |
| Identity | ERC-8004 (Identity · Reputation · Validation) |

## API routes

| Route | Description |
|---|---|
| `POST /api/agent/start` | Start the agent loop |
| `POST /api/agent/stop` | Stop the agent loop |
| `GET /api/agent/status` | Current status + PnL |
| `GET /api/agent/config` | Agent configuration |
| `GET /api/market/signals` | Latest PRISM signals |
| `POST /api/kraken/execute` | Manual trade execution |

## Hackathon contracts (Sepolia)

| Contract | Address |
|---|---|
| AgentRegistry | `0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3` |
| HackathonVault | `0x0E7CD8ef9743FEcf94f9103033a044caBD45fC90` |
| RiskRouter | `0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC` |
| ReputationRegistry | `0x423a9904e39537a9997fbaF0f220d79D7d545763` |
| ValidationRegistry | `0x92bF63E5C7Ac6980f237a7164Ab413BE226187F1` |
