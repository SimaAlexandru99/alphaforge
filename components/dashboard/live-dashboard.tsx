"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { useEffect, useState } from "react";
import { PnlLineChart } from "@/components/charts/pnl-line-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgentConfigInput, DashboardMetrics } from "@/lib/types";

function MetricCard(props: { label: string; value: string; hint: string }) {
  return (
    <Card className="rounded-3xl border-border/60 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="font-medium text-muted-foreground text-sm">
          {props.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl">{props.value}</p>
        <p className="mt-2 text-muted-foreground text-sm">{props.hint}</p>
      </CardContent>
    </Card>
  );
}

export function LiveDashboard({
  initialData,
  config,
}: {
  initialData: DashboardMetrics;
  config: AgentConfigInput;
}) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const eventSource = new EventSource("/api/agent/status");
    eventSource.onmessage = (event) => {
      setData(JSON.parse(event.data) as DashboardMetrics);
    };
    return () => eventSource.close();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-border/60 bg-card/70 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm uppercase tracking-[0.24em]">
            AlphaForge · Command center
          </p>
          <h1 className="font-heading text-4xl">
            Live operations &amp; telemetry
          </h1>
          <p className="max-w-3xl text-muted-foreground text-sm">
            Real-time PnL, positions, PRISM signals, and agent decisions. SSE
            updates from the worker; Kraken CLI handles paper or live execution.
            With simulation enabled, AlphaForge stays usable without external API
            keys.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={data.runtime.isActive ? "default" : "secondary"}>
            {data.runtime.isActive ? "Worker active" : "Worker stopped"}
          </Badge>
          <Badge variant={config.isEnabled ? "default" : "secondary"}>
            {config.isEnabled ? "Agent enabled" : "Agent disabled"}
          </Badge>
          <span
            className="text-muted-foreground text-sm"
            suppressHydrationWarning
          >
            {data.runtime.lastHeartbeat
              ? `Heartbeat ${formatDistanceToNowStrict(new Date(data.runtime.lastHeartbeat))} ago`
              : "No heartbeat yet"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          hint="Realized + unrealized"
          label="Total PnL"
          value={`$${data.totals.totalPnl.toFixed(2)}`}
        />
        <MetricCard
          hint="Closed positions only"
          label="Realized"
          value={`$${data.totals.realizedPnl.toFixed(2)}`}
        />
        <MetricCard
          hint="Currently held paper positions"
          label="Open Positions"
          value={String(data.totals.openPositions)}
        />
        <MetricCard
          hint="SQLite + Prisma audit trail"
          label="Trades Logged"
          value={String(data.totals.totalTrades)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="rounded-3xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>PnL curve</CardTitle>
          </CardHeader>
          <CardContent>
            <PnlLineChart data={data.pnlSeries} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Latest Signals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.signals.map((signal) => (
              <div
                className="rounded-2xl border border-border/60 bg-background/70 p-4"
                key={signal.symbol}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{signal.symbol}</span>
                  <span className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    {signal.source}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <span>Price: ${signal.price.toFixed(2)}</span>
                  <span>RSI: {signal.rsi.toFixed(1)}</span>
                  <span>Trend: {signal.trend}</span>
                  <span>Risk: {signal.riskScore.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-3xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Open positions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Mark</TableHead>
                  <TableHead>PnL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.positions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="py-8 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      No open paper positions.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">
                        {position.symbol}
                      </TableCell>
                      <TableCell>{position.quantity.toFixed(6)}</TableCell>
                      <TableCell>${position.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>${position.currentPrice.toFixed(2)}</TableCell>
                      <TableCell
                        className={
                          position.unrealizedPnl >= 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }
                      >
                        ${position.unrealizedPnl.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Decision feed</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-82.5 pr-4">
              <div className="space-y-3">
                {data.runs.map((run) => (
                  <div
                    className="rounded-2xl border border-border/60 bg-background/70 p-4"
                    key={run.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            run.status === "EXECUTED" ? "default" : "secondary"
                          }
                        >
                          {run.action}
                        </Badge>
                        <span className="font-medium text-sm">
                          {run.symbol}
                        </span>
                      </div>
                      <span
                        className="text-muted-foreground text-xs"
                        suppressHydrationWarning
                      >
                        {formatDistanceToNowStrict(new Date(run.createdAt))} ago
                      </span>
                    </div>
                    <p className="mt-3 text-sm">{run.reason}</p>
                    {run.blockedReason ? (
                      <p className="mt-2 text-red-500 text-sm">
                        {run.blockedReason}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
