-- CreateTable
CREATE TABLE "AgentConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tradingMode" TEXT NOT NULL DEFAULT 'paper',
    "symbolsJson" TEXT NOT NULL DEFAULT '["BTCUSD","ETHUSD"]',
    "loopIntervalSec" INTEGER NOT NULL DEFAULT 60,
    "maxExposurePct" REAL NOT NULL DEFAULT 0.10,
    "stopLossPct" REAL NOT NULL DEFAULT 0.03,
    "takeProfitPct" REAL NOT NULL DEFAULT 0.05,
    "maxDrawdownPct" REAL NOT NULL DEFAULT 0.15,
    "defaultOrderUsd" REAL NOT NULL DEFAULT 100,
    "llmProvider" TEXT DEFAULT 'heuristic',
    "llmModel" TEXT DEFAULT 'gpt-4o-mini',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SignalSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "rsi" REAL,
    "trend" TEXT,
    "volatility" REAL,
    "riskScore" REAL,
    "payloadJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blockedReason" TEXT,
    "price" REAL NOT NULL,
    "quantity" REAL,
    "orderValueUsd" REAL,
    "executionMode" TEXT,
    "riskScore" REAL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "quantity" REAL NOT NULL,
    "entryPrice" REAL NOT NULL,
    "currentPrice" REAL,
    "exitPrice" REAL,
    "realizedPnl" REAL,
    "decisionReason" TEXT,
    "orderRef" TEXT,
    "executionMode" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SignalSnapshot_symbol_createdAt_idx" ON "SignalSnapshot"("symbol", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AgentRun_createdAt_idx" ON "AgentRun"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AgentRun_symbol_createdAt_idx" ON "AgentRun"("symbol", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Trade_status_symbol_idx" ON "Trade"("status", "symbol");

-- CreateIndex
CREATE INDEX "Trade_openedAt_idx" ON "Trade"("openedAt" DESC);
