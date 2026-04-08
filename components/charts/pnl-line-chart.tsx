"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function PnlLineChart({
  data,
}: {
  data: Array<{ label: string; pnl: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data}>
          <CartesianGrid opacity={0.2} strokeDasharray="3 3" />
          <XAxis
            axisLine={false}
            dataKey="label"
            minTickGap={24}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
            tickLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value) => {
              const numeric =
                typeof value === "number" ? value : Number(value ?? 0);
              return [`$${numeric.toFixed(2)}`, "PnL"];
            }}
          />
          <Line
            dataKey="pnl"
            dot={false}
            stroke="var(--color-chart-2)"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
