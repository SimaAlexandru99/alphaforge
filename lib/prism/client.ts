import { env } from "@/lib/env";
import type { MarketSignal } from "@/lib/types";

const authHeaders: Record<string, string> = env.prismApiKey
  ? { "X-API-Key": env.prismApiKey }
  : {};

// Map Kraken pair symbols to PRISM asset symbols
const KRAKEN_TO_PRISM: Record<string, string> = {
  XBTUSD: "BTC",
  BTCUSD: "BTC",
  ETHUSD: "ETH",
  SOLUSD: "SOL",
  XRPUSD: "XRP",
  ADAUSD: "ADA",
  DOTUSD: "DOT",
  LINKUSD: "LINK",
  MATICUSD: "MATIC",
  AVAXUSD: "AVAX",
};

function toPrismSymbol(krakenSymbol: string): string {
  return KRAKEN_TO_PRISM[krakenSymbol.toUpperCase()] ?? krakenSymbol;
}

async function safeFetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: authHeaders,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`PRISM ${url} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

function createMockSignal(symbol: string): MarketSignal {
  const seed = symbol
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const minuteBucket = Math.floor(Date.now() / 60_000) % 20;
  const price = 100 + (seed % 100) * 12 + minuteBucket * 4;
  const rsi = 30 + ((seed + minuteBucket * 3) % 40);
  let trend: "bullish" | "bearish" | "sideways";
  if (rsi > 58) {
    trend = "bullish";
  } else if (rsi < 42) {
    trend = "bearish";
  } else {
    trend = "sideways";
  }
  const volatility = Number(
    (0.8 + ((seed + minuteBucket) % 10) * 0.22).toFixed(2)
  );
  const riskScore = Number(
    Math.min(0.95, volatility / 5 + Math.abs(50 - rsi) / 100).toFixed(2)
  );

  return {
    symbol,
    price,
    rsi,
    trend,
    volatility,
    riskScore,
    source: "mock",
    raw: { mock: true },
  };
}

export async function getSignal(symbol: string): Promise<MarketSignal> {
  const krakenSymbol = symbol.toUpperCase();
  const prismSymbol = toPrismSymbol(krakenSymbol);

  try {
    const [signal, risk] = await Promise.all([
      safeFetchJson<Record<string, unknown>>(
        `${env.prismBaseUrl}/signals/${prismSymbol}`
      ),
      safeFetchJson<Record<string, unknown>>(
        `${env.prismBaseUrl}/risk/${prismSymbol}`
      ),
    ]);

    // PRISM returns { object: "list", data: [...] } — extract first item
    const item =
      signal.object === "list" && Array.isArray(signal.data)
        ? (signal.data[0] as Record<string, unknown>)
        : signal;

    const indicators = item.indicators as Record<string, unknown> | undefined;
    const priceValue = Number(item.current_price ?? item.price ?? 0);
    const rsiValue = Number(indicators?.rsi ?? item.rsi ?? 50);
    const trendRaw = String(
      item.direction ?? item.overall_signal ?? item.trend ?? "sideways"
    ).toLowerCase();
    const volatilityValue = Number(
      risk.daily_volatility ?? risk.volatility ?? 1
    );
    const drawdown = Number(risk.current_drawdown ?? 0);
    const riskScoreValue = Number(
      Math.min(0.95, drawdown / 100 + Math.abs(50 - rsiValue) / 200).toFixed(2)
    );

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      throw new Error("Invalid PRISM price payload");
    }

    let resolvedTrend: "bullish" | "bearish" | "sideways";
    if (trendRaw.includes("bull")) {
      resolvedTrend = "bullish";
    } else if (trendRaw.includes("bear")) {
      resolvedTrend = "bearish";
    } else {
      resolvedTrend = "sideways";
    }

    return {
      symbol: krakenSymbol,
      price: priceValue,
      rsi: Number.isFinite(rsiValue) ? rsiValue : 50,
      trend: resolvedTrend,
      volatility: Number.isFinite(volatilityValue) ? volatilityValue : 1,
      riskScore: Number.isFinite(riskScoreValue) ? riskScoreValue : 0.25,
      source: "live",
      raw: { signal, risk },
    };
  } catch {
    return createMockSignal(krakenSymbol);
  }
}
