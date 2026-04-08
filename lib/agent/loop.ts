import { ensureAgentConfig, getAgentConfig } from "@/lib/agent/config";
import { decideTrade } from "@/lib/agent/decision";
import { applyExitRules, evaluateRisk } from "@/lib/agent/risk";
import { DECISION_ACTION, RUN_STATUS } from "@/lib/domain";
import { env } from "@/lib/env";
import type { RunStatus } from "@/lib/generated/prisma/client";
import { executePaperOrder } from "@/lib/kraken/cli";
import {
  getOrRegisterAgent,
  postCheckpoint,
  postTradeFeedback,
  submitTradeIntent,
} from "@/lib/onchain/registry";
import { getSignal } from "@/lib/prism/client";
import { prisma } from "@/lib/prisma";
import { writeRuntimeState } from "@/lib/runtime-store";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processSymbol(
  symbol: string,
  config: Awaited<ReturnType<typeof getAgentConfig>>,
  totalPnl: number
) {
  const signal = await getSignal(symbol);

  await prisma.signalSnapshot.create({
    data: {
      symbol: signal.symbol,
      price: signal.price,
      rsi: signal.rsi,
      trend: signal.trend,
      volatility: signal.volatility,
      riskScore: signal.riskScore,
      payloadJson: JSON.stringify(signal.raw ?? {}),
    },
  });

  const openTrade = await prisma.trade.findFirst({
    where: { symbol: signal.symbol, status: "OPEN" },
    orderBy: { openedAt: "asc" },
  });

  const openPosition = openTrade
    ? { quantity: openTrade.quantity, entryPrice: openTrade.entryPrice }
    : null;

  let decision = await decideTrade({
    config,
    signal,
    hasOpenPosition: Boolean(openTrade),
    latestPnl: totalPnl,
  });

  const exitRule = applyExitRules({ config, signal, openTrade: openPosition });
  if (exitRule.forcedAction && exitRule.forcedReason) {
    decision = {
      ...decision,
      action: exitRule.forcedAction,
      reason: exitRule.forcedReason,
    };
  }

  const risk = evaluateRisk({
    config,
    signal,
    action: decision.action,
    capitalUsd: env.defaultCapitalUsd,
    currentTotalPnl: totalPnl,
    openTrade: openPosition,
  });

  if (!risk.allowed) {
    await prisma.agentRun.create({
      data: {
        symbol: signal.symbol,
        action: decision.action,
        status: RUN_STATUS.BLOCKED as RunStatus,
        reason: decision.reason,
        blockedReason: risk.blockedReason,
        price: signal.price,
        riskScore: signal.riskScore,
        metadataJson: JSON.stringify({ source: decision.source }),
      },
    });
    return;
  }

  if (decision.action === DECISION_ACTION.HOLD) {
    await prisma.agentRun.create({
      data: {
        symbol: signal.symbol,
        action: decision.action,
        status: RUN_STATUS.OBSERVED as RunStatus,
        reason: decision.reason,
        price: signal.price,
        riskScore: signal.riskScore,
        metadataJson: JSON.stringify({ source: decision.source }),
      },
    });
    return;
  }

  await executeAndRecord({ config, signal, decision, openTrade });
}

async function executeAndRecord(ctx: {
  config: Awaited<ReturnType<typeof getAgentConfig>>;
  signal: Awaited<ReturnType<typeof getSignal>>;
  decision: Awaited<ReturnType<typeof decideTrade>>;
  openTrade: { id: string; quantity: number; entryPrice: number } | null;
}) {
  const { config, signal, decision, openTrade } = ctx;
  // For SELL, use exact quantity from open trade to match paper wallet balance
  const quantity =
    decision.action === DECISION_ACTION.SELL && openTrade
      ? openTrade.quantity
      : Number((config.defaultOrderUsd / signal.price).toFixed(6));

  // ERC-8004: submit TradeIntent to RiskRouter (non-blocking — don't gate execution)
  getOrRegisterAgent()
    .then((agentId) =>
      submitTradeIntent({
        agentId,
        pair: signal.symbol,
        action: decision.action,
        amountUsd: config.defaultOrderUsd,
      })
    )
    .catch(() => undefined);

  const execution = await executePaperOrder({
    symbol: signal.symbol,
    side: decision.action === DECISION_ACTION.BUY ? "buy" : "sell",
    volume: quantity,
  });

  if (decision.action === DECISION_ACTION.BUY) {
    await prisma.trade.create({
      data: {
        symbol: signal.symbol,
        quantity,
        entryPrice: signal.price,
        currentPrice: signal.price,
        decisionReason: decision.reason,
        orderRef: execution.orderRef,
        executionMode: execution.executionMode,
      },
    });
  } else if (openTrade) {
    await prisma.trade.update({
      where: { id: openTrade.id },
      data: {
        status: "CLOSED",
        currentPrice: signal.price,
        exitPrice: signal.price,
        realizedPnl: Number(
          ((signal.price - openTrade.entryPrice) * openTrade.quantity).toFixed(
            2
          )
        ),
        closedAt: new Date(),
        orderRef: execution.orderRef,
      },
    });
  }

  await prisma.agentRun.create({
    data: {
      symbol: signal.symbol,
      action: decision.action,
      status: (execution.ok
        ? RUN_STATUS.EXECUTED
        : RUN_STATUS.FAILED) as RunStatus,
      reason: decision.reason,
      price: signal.price,
      quantity,
      orderValueUsd: config.defaultOrderUsd,
      executionMode: execution.executionMode,
      riskScore: signal.riskScore,
      blockedReason: execution.ok ? null : execution.rawOutput,
      metadataJson: JSON.stringify({
        source: decision.source,
        rawOutput: execution.rawOutput,
      }),
    },
  });

  // ERC-8004: post reputation + validation checkpoints on-chain (non-blocking)
  if (execution.ok) {
    getOrRegisterAgent()
      .then((agentId) => {
        const pnlUsd =
          decision.action === DECISION_ACTION.SELL && openTrade
            ? (signal.price - openTrade.entryPrice) * openTrade.quantity
            : 0;
        return Promise.all([
          postTradeFeedback({
            agentId,
            pnlUsd,
            action: decision.action,
            symbol: signal.symbol,
          }),
          postCheckpoint({
            agentId,
            action: decision.action,
            symbol: signal.symbol,
            reason: decision.reason,
            confidence: decision.confidence,
          }),
        ]);
      })
      .catch((err: unknown) =>
        console.warn("[ERC-8004] On-chain post failed:", err)
      );
  }
}

export async function runAgentIteration() {
  const config = await getAgentConfig();
  const totalPnl =
    (await prisma.trade.aggregate({ _sum: { realizedPnl: true } }))._sum
      .realizedPnl ?? 0;

  for (const symbol of config.symbols) {
    await processSymbol(symbol, config, totalPnl);
  }
}

export async function runAgentLoop() {
  await ensureAgentConfig();
  await writeRuntimeState({
    isActive: true,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    mode: env.tradingMode,
    lastError: null,
  });

  let active = true;
  const shutdown = async (error?: string) => {
    active = false;
    await writeRuntimeState({
      isActive: false,
      pid: null,
      stoppedAt: new Date().toISOString(),
      lastError: error ?? null,
    });
  };

  process.on("SIGTERM", () => {
    shutdown().catch(() => undefined);
  });
  process.on("SIGINT", () => {
    shutdown().catch(() => undefined);
  });

  while (active) {
    try {
      const config = await getAgentConfig();
      await writeRuntimeState({
        lastHeartbeat: new Date().toISOString(),
        mode: config.tradingMode,
      });

      if (config.isEnabled) {
        await runAgentIteration();
      }

      await wait(config.loopIntervalSec * 1000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown worker error";
      await writeRuntimeState({
        lastHeartbeat: new Date().toISOString(),
        lastError: message,
      });
      await wait(10_000);
    }
  }
}
