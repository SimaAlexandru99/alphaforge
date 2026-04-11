import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { readRuntimeState } from "@/lib/runtime-store";
import type { DashboardMetrics, MarketSignal } from "@/lib/types";

export async function getLatestSignals(): Promise<MarketSignal[]> {
  let rows = [] as Awaited<ReturnType<typeof prisma.signalSnapshot.findMany>>;
  try {
    rows = await prisma.signalSnapshot.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (err) {
    console.error("[dashboard] getLatestSignals failed:", err);
    return [];
  }

  const deduped = new Map<string, MarketSignal>();
  for (const row of rows) {
    if (!deduped.has(row.symbol)) {
      deduped.set(row.symbol, {
        symbol: row.symbol,
        price: row.price,
        rsi: row.rsi ?? 50,
        trend: (row.trend as MarketSignal["trend"]) ?? "sideways",
        volatility: row.volatility ?? 0,
        riskScore: row.riskScore ?? 0,
        source: "live",
      });
    }
  }

  return Array.from(deduped.values());
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const runtime = await readRuntimeState();
  let trades = [] as Awaited<ReturnType<typeof prisma.trade.findMany>>;
  let runs = [] as Awaited<ReturnType<typeof prisma.agentRun.findMany>>;
  let signals = [] as MarketSignal[];

  try {
    [trades, runs, signals] = await Promise.all([
      prisma.trade.findMany({ orderBy: { openedAt: "desc" } }),
      prisma.agentRun.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
      getLatestSignals(),
    ]);
  } catch (err) {
    console.error("[dashboard] getDashboardMetrics failed:", err);
    return {
      runtime: {
        ...runtime,
        lastError: runtime.lastError ?? "Database unavailable in dev session.",
      },
      totals: {
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalPnl: 0,
        openPositions: 0,
        totalTrades: 0,
      },
      positions: [],
      runs: [],
      signals: [],
      pnlSeries: [
        {
          label: subDays(new Date(), 1)
            .toISOString()
            .slice(5, 16)
            .replace("T", " "),
          pnl: 0,
        },
      ],
    };
  }

  const latestSignalBySymbol = new Map(
    signals.map((signal) => [signal.symbol, signal])
  );
  const openTrades = trades.filter((trade) => trade.status === "OPEN");
  const closedTrades = trades.filter((trade) => trade.status === "CLOSED");

  const realizedPnl = closedTrades.reduce(
    (sum, trade) => sum + (trade.realizedPnl ?? 0),
    0
  );
  const unrealizedPnl = openTrades.reduce((sum, trade) => {
    const currentPrice =
      latestSignalBySymbol.get(trade.symbol)?.price ??
      trade.currentPrice ??
      trade.entryPrice;
    return sum + (currentPrice - trade.entryPrice) * trade.quantity;
  }, 0);

  const pnlSeed = trades
    .slice()
    .sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime())
    .reduce<Array<{ label: string; pnl: number }>>((series, trade) => {
      const previous = series.at(-1)?.pnl ?? 0;
      const next = previous + (trade.realizedPnl ?? 0);
      series.push({
        label: trade.openedAt.toISOString().slice(5, 16).replace("T", " "),
        pnl: Number(next.toFixed(2)),
      });
      return series;
    }, []);

  return {
    runtime,
    totals: {
      realizedPnl: Number(realizedPnl.toFixed(2)),
      unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
      totalPnl: Number((realizedPnl + unrealizedPnl).toFixed(2)),
      openPositions: openTrades.length,
      totalTrades: trades.length,
    },
    positions: openTrades.map((trade) => {
      const currentPrice =
        latestSignalBySymbol.get(trade.symbol)?.price ??
        trade.currentPrice ??
        trade.entryPrice;
      return {
        id: trade.id,
        symbol: trade.symbol,
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        currentPrice,
        unrealizedPnl: Number(
          ((currentPrice - trade.entryPrice) * trade.quantity).toFixed(2)
        ),
        status: trade.status,
        openedAt: trade.openedAt.toISOString(),
      };
    }),
    runs: runs.map((run) => ({
      id: run.id,
      symbol: run.symbol,
      action: run.action,
      status: run.status,
      reason: run.reason,
      blockedReason: run.blockedReason,
      price: run.price,
      createdAt: run.createdAt.toISOString(),
    })),
    signals,
    pnlSeries: pnlSeed.length
      ? pnlSeed
      : [
          {
            label: subDays(new Date(), 1)
              .toISOString()
              .slice(5, 16)
              .replace("T", " "),
            pnl: 0,
          },
        ],
  };
}
