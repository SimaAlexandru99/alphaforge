import { SignalsRadar } from "@/components/charts/signals-radar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestSignals } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const signals = await getLatestSignals();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm uppercase tracking-[0.24em]">
          AlphaForge · Signals
        </p>
        <h1 className="font-heading text-4xl">PRISM market intelligence</h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Latest RSI, trend, volatility, and risk snapshots per symbol—fed into
          AlphaForge&apos;s decision loop. Without a PRISM API key, the app uses
          deterministic mock signals so development and UI keep working.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="rounded-3xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Signal Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <SignalsRadar signals={signals} />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {signals.map((signal) => (
            <Card
              className="rounded-3xl border-border/60 bg-card/80"
              key={signal.symbol}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{signal.symbol}</span>
                  <span className="font-normal text-muted-foreground text-sm">
                    {signal.source}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-semibold text-lg">
                    ${signal.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">RSI</p>
                  <p className="font-semibold text-lg">
                    {signal.rsi.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trend</p>
                  <p className="font-semibold text-lg capitalize">
                    {signal.trend}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Risk</p>
                  <p className="font-semibold text-lg">
                    {signal.riskScore.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
