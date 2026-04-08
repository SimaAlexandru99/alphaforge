import { NextResponse } from "next/server";
import { getSignal } from "@/lib/prism/client";
import { getLatestSignals } from "@/lib/server/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (symbol) {
    return NextResponse.json(await getSignal(symbol));
  }

  return NextResponse.json(await getLatestSignals());
}
