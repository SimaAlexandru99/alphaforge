import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { executePaperOrder } from "@/lib/kraken/cli";
import { getOrRegisterAgent } from "@/lib/onchain/registry";
import { publicClient } from "@/lib/onchain/client";
import { getSignal } from "@/lib/prism/client";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(execFile);

async function section(name: string, fn: () => Promise<void>) {
  process.stdout.write(`[${name}] `);
  try {
    await fn();
    console.log("PASS");
  } catch (e) {
    console.log("FAIL:", e instanceof Error ? e.message.split("\n")[0] : e);
  }
}

async function main() {
  await section("PRISM BTC signal", async () => {
    const s = await getSignal("XBTUSD");
    if (!s.price || s.price < 10000) throw new Error("Bad price: " + s.price);
    process.stdout.write("price=$" + s.price + " rsi=" + s.rsi + " trend=" + s.trend + " ");
  });

  await section("PRISM ETH signal", async () => {
    const s = await getSignal("ETHUSD");
    if (!s.price || s.price < 100) throw new Error("Bad price: " + s.price);
    process.stdout.write("price=$" + s.price + " rsi=" + s.rsi + " trend=" + s.trend + " ");
  });

  await section("Kraken paper balance", async () => {
    const { stdout } = await execAsync("/home/simaa/.cargo/bin/kraken", ["paper", "balance"]);
    const usdLine = stdout.split("\n").find((l) => l.includes("USD")) ?? "";
    process.stdout.write(usdLine.replace(/[|│\s]+/g, " ").trim() + " ");
  });

  await section("Kraken paper micro-buy (0.00001 BTC)", async () => {
    const r = await executePaperOrder({ symbol: "XBTUSD", side: "buy", volume: 0.00001 });
    if (!r.ok) throw new Error(r.rawOutput);
    process.stdout.write("mode=" + r.executionMode + " ");
  });

  await section("Database open trades", async () => {
    const trades = await prisma.trade.findMany({ where: { status: "OPEN" } });
    process.stdout.write(trades.length + " open: " + trades.map((t) => t.symbol + "@" + t.entryPrice).join(", ") + " ");
    await prisma.$disconnect();
  });

  await section("Database counts", async () => {
    const trades = await prisma.trade.count();
    const runs = await prisma.agentRun.count();
    process.stdout.write(trades + " trades, " + runs + " runs ");
    await prisma.$disconnect();
  });

  await section("ERC-8004 agentId", async () => {
    const agentId = await getOrRegisterAgent();
    if (agentId !== BigInt(45)) throw new Error("Expected 45, got " + agentId);
    process.stdout.write("agentId=" + agentId + " ");
  });

  await section("Sepolia wallet balance", async () => {
    const bal = await publicClient.getBalance({
      address: process.env.AGENT_WALLET_ADDRESS as `0x${string}`,
    });
    const eth = Number(bal) / 1e18;
    if (eth < 0.001) throw new Error("Insufficient gas: " + eth + " ETH");
    process.stdout.write(eth.toFixed(4) + " ETH ");
  });

  console.log("\nAll tests done.");
}

main().catch(console.error);
