import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import type { RuntimeState } from "@/lib/types";

const runtimeDir = path.join(process.cwd(), ".runtime");
const runtimeFile = path.join(runtimeDir, "agent-state.json");

const defaultState: RuntimeState = {
  isActive: false,
  pid: null,
  startedAt: null,
  stoppedAt: null,
  lastHeartbeat: null,
  lastError: null,
  mode: env.tradingMode,
};

export async function ensureRuntimeDir() {
  await mkdir(runtimeDir, { recursive: true });
}

export async function readRuntimeState(): Promise<RuntimeState> {
  try {
    const raw = await readFile(runtimeFile, "utf8");
    return { ...defaultState, ...JSON.parse(raw) } as RuntimeState;
  } catch {
    return defaultState;
  }
}

export async function writeRuntimeState(nextState: Partial<RuntimeState>) {
  const current = await readRuntimeState();
  const merged = { ...current, ...nextState };
  await ensureRuntimeDir();
  await writeFile(runtimeFile, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

export function isProcessRunning(pid: number | null) {
  if (!pid) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
