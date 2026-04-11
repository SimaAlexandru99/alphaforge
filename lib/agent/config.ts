import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { AgentConfigInput } from "@/lib/types";

const configSchema = z.object({
  symbols: z.array(z.string().min(3)).min(1),
  isEnabled: z.boolean(),
  tradingMode: z.string().default("paper"),
  loopIntervalSec: z.number().int().min(15).max(3600),
  maxExposurePct: z.number().min(0.01).max(1),
  stopLossPct: z.number().min(0.005).max(0.5),
  takeProfitPct: z.number().min(0.005).max(1),
  maxDrawdownPct: z.number().min(0.01).max(1),
  defaultOrderUsd: z.number().min(10).max(1_000_000),
  llmProvider: z.string().min(2),
  llmModel: z.string().min(2),
});

export async function ensureAgentConfig() {
  try {
    const existing = await prisma.agentConfig.findUnique({
      where: { id: "default" },
    });
    if (existing) {
      return existing;
    }

    return prisma.agentConfig.create({
      data: {
        id: "default",
        isEnabled: false,
        tradingMode: "paper",
        symbolsJson: JSON.stringify(["BTCUSD", "ETHUSD"]),
        loopIntervalSec: 60,
        maxExposurePct: 0.1,
        stopLossPct: 0.03,
        takeProfitPct: 0.05,
        maxDrawdownPct: 0.15,
        defaultOrderUsd: 100,
        llmProvider: env.llmProvider,
        llmModel: env.llmModel,
      },
    });
  } catch (err) {
    console.error("[config] ensureAgentConfig failed:", err);
    return {
      id: "default",
      isEnabled: false,
      tradingMode: "paper",
      symbolsJson: JSON.stringify(["BTCUSD", "ETHUSD"]),
      loopIntervalSec: 60,
      maxExposurePct: 0.1,
      stopLossPct: 0.03,
      takeProfitPct: 0.05,
      maxDrawdownPct: 0.15,
      defaultOrderUsd: 100,
      llmProvider: env.llmProvider,
      llmModel: env.llmModel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function getAgentConfig(): Promise<AgentConfigInput> {
  const config = await ensureAgentConfig();
  return {
    symbols: JSON.parse(config.symbolsJson) as string[],
    isEnabled: config.isEnabled,
    tradingMode: config.tradingMode,
    loopIntervalSec: config.loopIntervalSec,
    maxExposurePct: config.maxExposurePct,
    stopLossPct: config.stopLossPct,
    takeProfitPct: config.takeProfitPct,
    maxDrawdownPct: config.maxDrawdownPct,
    defaultOrderUsd: config.defaultOrderUsd,
    llmProvider: config.llmProvider ?? env.llmProvider,
    llmModel: config.llmModel ?? env.llmModel,
  };
}

export async function updateAgentConfig(input: Partial<AgentConfigInput>) {
  const current = await getAgentConfig();
  const next = configSchema.parse({
    ...current,
    ...input,
    symbols:
      input.symbols?.map((symbol) => symbol.trim().toUpperCase()) ??
      current.symbols,
  });

  try {
    return await prisma.agentConfig.update({
      where: { id: "default" },
      data: {
        isEnabled: next.isEnabled,
        tradingMode: next.tradingMode,
        symbolsJson: JSON.stringify(next.symbols),
        loopIntervalSec: next.loopIntervalSec,
        maxExposurePct: next.maxExposurePct,
        stopLossPct: next.stopLossPct,
        takeProfitPct: next.takeProfitPct,
        maxDrawdownPct: next.maxDrawdownPct,
        defaultOrderUsd: next.defaultOrderUsd,
        llmProvider: next.llmProvider,
        llmModel: next.llmModel,
      },
    });
  } catch {
    return null;
  }
}
