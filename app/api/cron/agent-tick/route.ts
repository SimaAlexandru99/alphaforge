import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAgentConfig } from "@/lib/agent/config";
import { runAgentIteration } from "@/lib/agent/loop";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[cron/agent-tick] CRON_SECRET unset — allowing request (development only). Set CRON_SECRET in .env for production-like checks."
      );
      return true;
    }
    return false;
  }
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return false;
  }
  const token = auth.slice("Bearer ".length);
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getAgentConfig();
  const now = new Date();

  if (!config.isEnabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "agent_disabled",
    });
  }

  try {
    await runAgentIteration();
    await prisma.agentConfig.update({
      where: { id: "default" },
      data: { lastCronHeartbeat: now },
    });
    return NextResponse.json({ ok: true, at: now.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/agent-tick]", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
