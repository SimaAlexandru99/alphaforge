/**
 * Seed the DB with realistic demo trades + agent run history.
 * Run once: pnpm exec tsx scripts/seed-demo.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

const NOW = Date.now();
const HOUR = 3_600_000;

interface SeedTrade {
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  hoursAgo: number;
}

const seedTrades: SeedTrade[] = [
  { symbol: "XBTUSD", entryPrice: 68420, exitPrice: 71850, quantity: 0.00146, hoursAgo: 192 },
  { symbol: "XBTUSD", entryPrice: 71200, exitPrice: 69900, quantity: 0.00140, hoursAgo: 144 },
  { symbol: "XBTUSD", entryPrice: 70100, exitPrice: 72300, quantity: 0.00142, hoursAgo: 96 },
  { symbol: "XBTUSD", entryPrice: 71500, exitPrice: 73100, quantity: 0.00139, hoursAgo: 48 },
  { symbol: "ETHUSD", entryPrice: 2050,  exitPrice: 2180,  quantity: 0.04878, hoursAgo: 168 },
  { symbol: "ETHUSD", entryPrice: 2160,  exitPrice: 2090,  quantity: 0.04629, hoursAgo: 120 },
  { symbol: "ETHUSD", entryPrice: 2100,  exitPrice: 2220,  quantity: 0.04761, hoursAgo: 72  },
  { symbol: "ETHUSD", entryPrice: 2190,  exitPrice: 2250,  quantity: 0.04566, hoursAgo: 24  },
];

const buyReasons = [
  "RSI at 42 — oversold. Bullish divergence detected. Risk score 0.21, trend neutral. Initiating controlled entry.",
  "PRISM signal: trend bullish, RSI 48. Volatility moderate. Risk guardrails satisfied — entering long.",
  "RSI recovering from oversold (38→54). Strong directional bias. Low riskScore (0.15) — buy signal.",
];

const sellReasons = [
  "Take-profit target reached (+5.1%). Closing position to lock gains.",
  "Stop-loss triggered at -3.2% drawdown. Exiting to preserve capital.",
  "RSI at 71 — overbought. Trend showing bearish divergence. Closing position.",
];

async function main() {
  console.log("Seeding demo data...\n");

  // Clear existing data so re-runs don't duplicate records
  await prisma.trade.deleteMany();
  await prisma.agentRun.deleteMany();

  let totalPnl = 0;

  for (const t of seedTrades) {
    const openedAt = new Date(NOW - t.hoursAgo * HOUR);
    const closedAt = new Date(openedAt.getTime() + 4 * HOUR);
    const realizedPnl = Number(((t.exitPrice - t.entryPrice) * t.quantity).toFixed(2));
    totalPnl += realizedPnl;
    const buyReason = buyReasons[Math.floor(Math.random() * buyReasons.length)];
    const sellReason = sellReasons[Math.floor(Math.random() * sellReasons.length)];

    // AgentRun for BUY
    await prisma.agentRun.create({
      data: {
        symbol: t.symbol,
        action: "BUY",
        status: "EXECUTED",
        reason: buyReason,
        price: t.entryPrice,
        quantity: t.quantity,
        orderValueUsd: Number((t.entryPrice * t.quantity).toFixed(2)),
        executionMode: "paper-cli",
        riskScore: parseFloat((Math.random() * 0.35 + 0.05).toFixed(2)),
        createdAt: openedAt,
      },
    });

    // AgentRun for SELL
    await prisma.agentRun.create({
      data: {
        symbol: t.symbol,
        action: "SELL",
        status: "EXECUTED",
        reason: sellReason,
        price: t.exitPrice,
        quantity: t.quantity,
        orderValueUsd: Number((t.exitPrice * t.quantity).toFixed(2)),
        executionMode: "paper-cli",
        riskScore: parseFloat((Math.random() * 0.35 + 0.05).toFixed(2)),
        createdAt: closedAt,
      },
    });

    // Closed trade
    await prisma.trade.create({
      data: {
        symbol: t.symbol,
        status: "CLOSED",
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        currentPrice: t.exitPrice,
        exitPrice: t.exitPrice,
        realizedPnl,
        decisionReason: buyReason,
        orderRef: `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        executionMode: "paper-cli",
        openedAt,
        closedAt,
        createdAt: openedAt,
        updatedAt: closedAt,
      },
    });

    const sign = realizedPnl >= 0 ? "+" : "";
    console.log(`  ${t.symbol}  ${t.entryPrice}→${t.exitPrice}  PnL: ${sign}${realizedPnl.toFixed(2)} USD`);
  }

  const sign = totalPnl >= 0 ? "+" : "";
  console.log(`\nTotal PnL: ${sign}${totalPnl.toFixed(2)} USD`);

  await prisma.agentConfig.upsert({
    where: { id: "default" },
    update: { isEnabled: true },
    create: {
      id: "default",
      isEnabled: true,
    },
  });
  console.log("Agent enabled for demo (Vercel Cron will run /api/cron/agent-tick).");

  console.log("Done. Run `pnpm dev` to see the dashboard.");
  await prisma.$disconnect();
}

main().catch(console.error);
