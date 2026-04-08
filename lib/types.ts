import type {
  DecisionAction,
  RunStatus,
  TradeStatus,
} from "@/lib/generated/prisma/client";

export interface AgentConfigInput {
  defaultOrderUsd: number;
  isEnabled: boolean;
  llmModel: string;
  llmProvider: string;
  loopIntervalSec: number;
  maxDrawdownPct: number;
  maxExposurePct: number;
  stopLossPct: number;
  symbols: string[];
  takeProfitPct: number;
  tradingMode: string;
}

export interface MarketSignal {
  price: number;
  raw?: Record<string, unknown>;
  riskScore: number;
  rsi: number;
  source: "live" | "mock";
  symbol: string;
  trend: "bullish" | "bearish" | "sideways";
  volatility: number;
}

export interface NormalizedDecision {
  action: DecisionAction;
  confidence: number;
  rawText?: string;
  reason: string;
  source: "llm" | "heuristic";
}

export interface RuntimeState {
  isActive: boolean;
  lastError: string | null;
  lastHeartbeat: string | null;
  mode: string;
  pid: number | null;
  startedAt: string | null;
  stoppedAt: string | null;
}

export interface RiskEvaluation {
  allowed: boolean;
  blockedReason?: string;
  forcedAction?: DecisionAction;
  forcedReason?: string;
}

export interface DashboardMetrics {
  pnlSeries: Array<{
    label: string;
    pnl: number;
  }>;
  positions: Array<{
    id: string;
    symbol: string;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnl: number;
    status: TradeStatus;
    openedAt: string;
  }>;
  runs: Array<{
    id: string;
    symbol: string;
    action: DecisionAction;
    status: RunStatus;
    reason: string;
    blockedReason: string | null;
    price: number;
    createdAt: string;
  }>;
  runtime: RuntimeState;
  signals: MarketSignal[];
  totals: {
    realizedPnl: number;
    unrealizedPnl: number;
    totalPnl: number;
    openPositions: number;
    totalTrades: number;
  };
}
