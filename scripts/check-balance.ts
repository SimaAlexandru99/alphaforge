import "dotenv/config";
import { publicClient } from "@/lib/onchain/client";

async function main() {
  const address = process.env.AGENT_WALLET_ADDRESS as `0x${string}`;
  if (!address) {
    throw new Error("AGENT_WALLET_ADDRESS not set");
  }

  const balance = await publicClient.getBalance({ address });
  const eth = Number(balance) / 1e18;
  console.log(`Sepolia ETH balance: ${eth.toFixed(6)} ETH`);
  console.log(`Address: ${address}`);

  if (eth < 0.001) {
    console.log("\nNeed ETH! Get it from:");
    console.log("  https://faucets.alchemy.com/sepolia");
    console.log("  https://sepoliafaucet.com");
    console.log("  https://www.infura.io/faucet/sepolia");
  }
}
main().catch(console.error);
