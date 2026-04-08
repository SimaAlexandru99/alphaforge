import { NextResponse } from "next/server";
import { z } from "zod";
import { executePaperOrder } from "@/lib/kraken/cli";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  symbol: z.string().min(3),
  side: z.enum(["buy", "sell"]),
  volume: z.number().positive(),
});

export async function POST(request: Request) {
  const payload = payloadSchema.parse(await request.json());
  const result = await executePaperOrder(payload);
  return NextResponse.json(result);
}
