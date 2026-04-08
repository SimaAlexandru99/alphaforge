export const DECISION_ACTION = {
  BUY: "BUY",
  SELL: "SELL",
  HOLD: "HOLD",
} as const;

export const RUN_STATUS = {
  OBSERVED: "OBSERVED",
  EXECUTED: "EXECUTED",
  BLOCKED: "BLOCKED",
  FAILED: "FAILED",
} as const;
