import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getLatestSignals } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  let trades = [] as Awaited<ReturnType<typeof prisma.trade.findMany>>;
  let signals = await getLatestSignals();

  try {
    [trades, signals] = await Promise.all([
      prisma.trade.findMany({ orderBy: { openedAt: "desc" } }),
      getLatestSignals(),
    ]);
  } catch {
    trades = [];
  }
  const latestSignalBySymbol = new Map(
    signals.map((signal) => [signal.symbol, signal.price])
  );

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm uppercase tracking-[0.24em]">
          AlphaForge · Trades
        </p>
        <h1 className="font-heading text-4xl">Execution ledger</h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Full AlphaForge trade history: orders, closures, and PnL. Open
          positions use the latest signal price for unrealized PnL.
        </p>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/80 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Mark</TableHead>
              <TableHead>Exit</TableHead>
              <TableHead>PnL</TableHead>
              <TableHead>Opened</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-10 text-center text-muted-foreground"
                  colSpan={8}
                >
                  No trades yet. Start the worker and enable the agent to
                  populate the ledger.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => {
                const markPrice =
                  latestSignalBySymbol.get(trade.symbol) ??
                  trade.currentPrice ??
                  trade.entryPrice;
                const unrealized =
                  (markPrice - trade.entryPrice) * trade.quantity;
                const pnl =
                  trade.status === "CLOSED"
                    ? (trade.realizedPnl ?? 0)
                    : unrealized;

                return (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trade.status === "OPEN" ? "default" : "secondary"
                        }
                      >
                        {trade.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.quantity.toFixed(6)}</TableCell>
                    <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>${markPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell
                      className={pnl >= 0 ? "text-emerald-600" : "text-red-500"}
                    >
                      ${pnl.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(trade.openedAt, "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
