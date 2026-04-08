import { NextResponse } from "next/server";
import { updateAgentConfig } from "@/lib/agent/config";
import { readRuntimeState, writeRuntimeState } from "@/lib/runtime-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const runtimeState = await readRuntimeState();
  await updateAgentConfig({ isEnabled: false });

  if (runtimeState.pid) {
    try {
      process.kill(runtimeState.pid, "SIGTERM");
    } catch {
      // ignore stale pid
    }
  }

  await writeRuntimeState({
    isActive: false,
    pid: null,
    stoppedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
