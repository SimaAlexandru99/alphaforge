import { NextResponse } from "next/server";
import { z } from "zod";
import { getAgentConfig, updateAgentConfig } from "@/lib/agent/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  symbols: z.array(z.string()).min(1),
  isEnabled: z.boolean(),
  tradingMode: z.string(),
  loopIntervalSec: z.number().int(),
  maxExposurePct: z.number(),
  stopLossPct: z.number(),
  takeProfitPct: z.number(),
  maxDrawdownPct: z.number(),
  defaultOrderUsd: z.number(),
  llmProvider: z.string(),
  llmModel: z.string(),
});

export async function GET() {
  return NextResponse.json(await getAgentConfig());
}

export async function POST(request: Request) {
  const payload = payloadSchema.parse(await request.json());
  await updateAgentConfig(payload);
  return NextResponse.json({ ok: true });
}
