"use client";

import { Play, Save, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AgentConfigInput, RuntimeState } from "@/lib/types";

export function AgentConfigForm({
  initialConfig,
  runtime,
}: {
  initialConfig: AgentConfigInput;
  runtime: RuntimeState;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState(initialConfig);

  const saveConfig = () => {
    startTransition(async () => {
      await fetch("/api/agent/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      router.refresh();
    });
  };

  const controlWorker = (path: "/api/agent/start" | "/api/agent/stop") => {
    startTransition(async () => {
      await fetch(path, { method: "POST" });
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-3xl border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Strategy Parameters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Symbols</Label>
            <Input
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  symbols: event.target.value
                    .split(",")
                    .map((item) => item.trim().toUpperCase())
                    .filter(Boolean),
                }))
              }
              value={config.symbols.join(",")}
            />
          </div>

          <div className="space-y-2">
            <Label>Loop Interval (sec)</Label>
            <Input
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  loopIntervalSec: Number(event.target.value),
                }))
              }
              type="number"
              value={config.loopIntervalSec}
            />
          </div>

          <div className="space-y-2">
            <Label>Default Order USD</Label>
            <Input
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  defaultOrderUsd: Number(event.target.value),
                }))
              }
              type="number"
              value={config.defaultOrderUsd}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Exposure %</Label>
            <Input
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  maxExposurePct: Number(event.target.value),
                }))
              }
              step="0.01"
              type="number"
              value={config.maxExposurePct}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Drawdown %</Label>
            <Input
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  maxDrawdownPct: Number(event.target.value),
                }))
              }
              step="0.01"
              type="number"
              value={config.maxDrawdownPct}
            />
          </div>

          <div className="space-y-2">
            <Label>Stop Loss %</Label>
            <Input
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  stopLossPct: Number(event.target.value),
                }))
              }
              step="0.01"
              type="number"
              value={config.stopLossPct}
            />
          </div>

          <div className="space-y-2">
            <Label>Take Profit %</Label>
            <Input
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  takeProfitPct: Number(event.target.value),
                }))
              }
              step="0.01"
              type="number"
              value={config.takeProfitPct}
            />
          </div>

          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select
              onValueChange={(value) =>
                setConfig((current) => ({
                  ...current,
                  llmProvider: value ?? "heuristic",
                }))
              }
              value={config.llmProvider}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heuristic">heuristic</SelectItem>
                <SelectItem value="openai">openai</SelectItem>
                <SelectItem value="anthropic">anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Input
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  llmModel: event.target.value,
                }))
              }
              value={config.llmModel}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3 md:col-span-2">
            <div>
              <p className="font-medium">Enable trading logic</p>
              <p className="text-muted-foreground text-sm">
                Worker can stay up while strategy execution is disabled.
              </p>
            </div>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={(checked) =>
                setConfig((current) => ({ ...current, isEnabled: checked }))
              }
            />
          </div>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button disabled={isPending} onClick={saveConfig}>
              <Save className="mr-2 h-4 w-4" />
              Save Config
            </Button>
            <Button
              disabled={isPending}
              onClick={() => controlWorker("/api/agent/start")}
              variant="secondary"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Worker
            </Button>
            <Button
              disabled={isPending}
              onClick={() => controlWorker("/api/agent/stop")}
              variant="outline"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Worker
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Runtime</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-muted-foreground">Process</p>
            <p className="mt-1 font-medium">
              {runtime.isActive
                ? `running (pid ${runtime.pid ?? "n/a"})`
                : "stopped"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-muted-foreground">Started At</p>
            <p className="mt-1 font-medium">{runtime.startedAt ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-muted-foreground">Last Heartbeat</p>
            <p className="mt-1 font-medium">{runtime.lastHeartbeat ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-muted-foreground">Last Error</p>
            <p className="mt-1 font-medium">{runtime.lastError ?? "none"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
