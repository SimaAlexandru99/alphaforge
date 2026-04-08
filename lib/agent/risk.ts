import { DECISION_ACTION } from "@/lib/domain";
import type { DecisionAction } from "@/lib/generated/prisma/client";
import type {
  AgentConfigInput,
  MarketSignal,
  RiskEvaluation,
} from "@/lib/types";

interface OpenTrade {
  entryPrice: number;
  quantity: number;
}

interface RiskInput {
  action: DecisionAction;
  capitalUsd: number;
  config: AgentConfigInput;
  currentTotalPnl: number;
  openTrade: OpenTrade | null;
  signal: MarketSignal;
}

export function applyExitRules(input: {
  config: AgentConfigInput;
  signal: MarketSignal;
  openTrade: OpenTrade | null;
}): RiskEvaluation {
  if (!input.openTrade) {
    return { allowed: true };
  }

  const stopLossPrice =
    input.openTrade.entryPrice * (1 - input.config.stopLossPct);
  const takeProfitPrice =
    input.openTrade.entryPrice * (1 + input.config.takeProfitPct);

  if (input.signal.price <= stopLossPrice) {
    return {
      allowed: true,
      forcedAction: DECISION_ACTION.SELL,
      forcedReason: `Stop-loss hit at ${input.signal.price.toFixed(2)}.`,
    };
  }

  if (input.signal.price >= takeProfitPrice) {
    return {
      allowed: true,
      forcedAction: DECISION_ACTION.SELL,
      forcedReason: `Take-profit hit at ${input.signal.price.toFixed(2)}.`,
    };
  }

  return { allowed: true };
}

export function evaluateRisk(input: RiskInput): RiskEvaluation {
  if (input.action === DECISION_ACTION.HOLD) {
    return { allowed: true };
  }

  const drawdown = input.currentTotalPnl / input.capitalUsd;
  if (drawdown <= -input.config.maxDrawdownPct) {
    return {
      allowed: false,
      blockedReason: `Circuit breaker active. Drawdown ${(drawdown * 100).toFixed(2)}% exceeds limit.`,
    };
  }

  if (input.action === DECISION_ACTION.BUY) {
    if (input.openTrade) {
      return {
        allowed: false,
        blockedReason: "Position already open for symbol.",
      };
    }

    const orderValueUsd = input.config.defaultOrderUsd;
    if (orderValueUsd > input.capitalUsd * input.config.maxExposurePct) {
      return {
        allowed: false,
        blockedReason: `Order size ${orderValueUsd.toFixed(2)} exceeds max exposure.`,
      };
    }
  }

  if (input.action === DECISION_ACTION.SELL && !input.openTrade) {
    return { allowed: false, blockedReason: "No open position to close." };
  }

  return { allowed: true };
}
