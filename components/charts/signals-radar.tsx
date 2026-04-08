"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { MarketSignal } from "@/lib/types";

export function SignalsRadar({ signals }: { signals: MarketSignal[] }) {
  const data = signals.slice(0, 4).map((signal) => ({
    symbol: signal.symbol,
    rsi: signal.rsi,
    risk: signal.riskScore * 100,
    volatility: signal.volatility * 20,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="symbol" />
          <Radar
            dataKey="rsi"
            fill="var(--color-chart-3)"
            fillOpacity={0.15}
            stroke="var(--color-chart-3)"
          />
          <Radar
            dataKey="risk"
            fill="var(--color-chart-5)"
            fillOpacity={0.12}
            stroke="var(--color-chart-5)"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
