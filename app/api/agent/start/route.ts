import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { updateAgentConfig } from "@/lib/agent/config";
import {
  isProcessRunning,
  readRuntimeState,
  writeRuntimeState,
} from "@/lib/runtime-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const runtimeState = await readRuntimeState();
  await updateAgentConfig({ isEnabled: true });

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
