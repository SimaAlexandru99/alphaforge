import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "@/lib/env";

const execFileAsync = promisify(execFile);

export interface KrakenExecutionResult {
  executionMode: string;
  ok: boolean;
  orderRef: string;
  rawOutput: string;
}

export async function executePaperOrder(input: {
  symbol: string;
  side: "buy" | "sell";
  volume: number;
}) {
  if (env.krakenCliSimulate) {
    return {
      ok: true,
      executionMode: "simulated-paper",
      orderRef: `sim-${Date.now()}`,
      rawOutput: JSON.stringify(input),
    } satisfies KrakenExecutionResult;
  }

  // kraken paper buy <PAIR> <VOLUME> --type market -o json
  const args = [
    "paper",
    input.side,
    input.symbol,
    String(input.volume),
    "--type",
    "market",
    "-o",
    "json",
  ];

  const childEnv = {
    ...process.env,
    KRAKEN_API_KEY: env.krakenApiKey,
    KRAKEN_API_SECRET: env.krakenApiSecret,
  };

  try {
    const { stdout, stderr } = await execFileAsync(env.krakenCliPath, args, {
      cwd: process.cwd(),
      env: childEnv,
    });

    return {
      ok: true,
      executionMode: "paper-cli",
      orderRef: `cli-${Date.now()}`,
      rawOutput: `${stdout}\n${stderr}`.trim(),
    } satisfies KrakenExecutionResult;
  } catch (error) {
    return {
      ok: false,
      executionMode: "paper-cli-error",
      orderRef: `failed-${Date.now()}`,
      rawOutput:
        error instanceof Error ? error.message : "Unknown Kraken CLI error",
    } satisfies KrakenExecutionResult;
  }
}
