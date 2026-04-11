-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DecisionAction" AS ENUM ('BUY', 'SELL', 'HOLD');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('OBSERVED', 'EXECUTED', 'BLOCKED', 'FAILED');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "AgentConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastCronHeartbeat" TIMESTAMP(3),
    "tradingMode" TEXT NOT NULL DEFAULT 'paper',
    "symbolsJson" TEXT NOT NULL DEFAULT '["BTCUSD","ETHUSD"]',
    "loopIntervalSec" INTEGER NOT NULL DEFAULT 60,
    "maxExposurePct" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "stopLossPct" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "takeProfitPct" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "maxDrawdownPct" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "defaultOrderUsd" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "llmProvider" TEXT DEFAULT 'heuristic',
    "llmModel" TEXT DEFAULT 'gpt-4o-mini',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalSnapshot" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "rsi" DOUBLE PRECISION,
    "trend" TEXT,
    "volatility" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "payloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "action" "DecisionAction" NOT NULL,
    "status" "RunStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "blockedReason" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION,
    "orderValueUsd" DOUBLE PRECISION,
    "executionMode" TEXT,
    "riskScore" DOUBLE PRECISION,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',
    "quantity" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION,
    "exitPrice" DOUBLE PRECISION,
    "realizedPnl" DOUBLE PRECISION,
    "decisionReason" TEXT,
    "orderRef" TEXT,
    "executionMode" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
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
