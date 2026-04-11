import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { RuntimeState } from "@/lib/types";

/** Match `vercel.json` cron cadence (Hobby = max 1/day; Pro can use tighter schedules). */
const CRON_HEARTBEAT_STALE_MS = 26 * 60 * 60 * 1000;

const runtimeDir =
  process.env.VERCEL === "1"
    ? "/tmp/.runtime"
    : path.join(process.cwd(), ".runtime");
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
  if (process.env.VERCEL === "1") {
    const base = { ...defaultState };
    try {
      const row = await prisma.agentConfig.findUnique({
        where: { id: "default" },
      });
      if (row?.lastCronHeartbeat) {
        const age = Date.now() - row.lastCronHeartbeat.getTime();
        const fresh = age < CRON_HEARTBEAT_STALE_MS;
        return {
          ...base,
          isActive: fresh,
          lastHeartbeat: row.lastCronHeartbeat.toISOString(),
          mode: row.tradingMode ?? base.mode,
        };
      }
    } catch (err) {
      console.error("[runtime-store] Vercel DB heartbeat read failed:", err);
    }
    try {
      const raw = await readFile(runtimeFile, "utf8");
      return { ...defaultState, ...JSON.parse(raw) } as RuntimeState;
    } catch {
      return base;
    }
  }

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
