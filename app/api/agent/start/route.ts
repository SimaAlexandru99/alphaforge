import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { updateAgentConfig } from "@/lib/agent/config";
import { runAgentIteration } from "@/lib/agent/loop";
import { prisma } from "@/lib/prisma";
import {
  isProcessRunning,
  readRuntimeState,
  writeRuntimeState,
} from "@/lib/runtime-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  await updateAgentConfig({ isEnabled: true });

  /** Vercel has no long-lived worker; cron is at most daily — run one iteration now so signals/trades can update. */
  if (process.env.VERCEL === "1") {
    try {
      await runAgentIteration();
      const now = new Date();
      await prisma.agentConfig.update({
        where: { id: "default" },
        data: { lastCronHeartbeat: now },
      });
      return NextResponse.json({
        ok: true,
        mode: "vercel-serverless",
        ranIteration: true,
        at: now.toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[agent/start] Vercel iteration failed:", error);
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  const runtimeState = await readRuntimeState();

  if (runtimeState.isActive && isProcessRunning(runtimeState.pid)) {
    return NextResponse.json({ ok: true, pid: runtimeState.pid, reused: true });
  }

  const child = spawn("npm", ["run", "worker"], {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  await writeRuntimeState({
    isActive: true,
    pid: child.pid ?? null,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    lastError: null,
  });

  return NextResponse.json({ ok: true, pid: child.pid, reused: false });
}
