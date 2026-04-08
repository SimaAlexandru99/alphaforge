import { describe, expect, it } from "vitest";
import { applyExitRules, evaluateRisk } from "@/lib/agent/risk";
import { DECISION_ACTION } from "@/lib/domain";

const config = {
  symbols: ["BTCUSD"],
  isEnabled: true,
  tradingMode: "paper",
  loopIntervalSec: 60,
  maxExposurePct: 0.1,
  stopLossPct: 0.03,
  takeProfitPct: 0.05,
  maxDrawdownPct: 0.15,
  defaultOrderUsd: 100,
  llmProvider: "heuristic",
  llmModel: "gpt-4o-mini",
};

describe("risk", () => {
  it("blocks buys above max exposure", () => {
    const result = evaluateRisk({
      config: { ...config, defaultOrderUsd: 2000 },
      signal: {
        symbol: "BTCUSD",
        price: 100,
        rsi: 30,
        trend: "bullish",
        volatility: 1,
        riskScore: 0.2,
        source: "mock",
      },
      action: DECISION_ACTION.BUY,
      capitalUsd: 10_000,
      currentTotalPnl: 0,
      openTrade: null,
    });

    expect(result.allowed).toBe(false);
  });

  it("forces a sell when stop-loss is hit", () => {
    const result = applyExitRules({
      config,
      signal: {
        symbol: "BTCUSD",
        price: 96,
        rsi: 20,
        trend: "bearish",
        volatility: 2,
        riskScore: 0.5,
        source: "mock",
      },
      openTrade: { quantity: 1, entryPrice: 100 },
    });

    expect(result.forcedAction).toBe(DECISION_ACTION.SELL);
  });
});
