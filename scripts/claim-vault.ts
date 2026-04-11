import "dotenv/config";
import { claimVaultAllocation } from "@/lib/onchain/registry";
import { publicClient } from "@/lib/onchain/client";

async function main() {
  const agentId = BigInt(process.env.ERC8004_AGENT_ID ?? "45");
  console.log(`Claiming vault for agentId=${agentId}...`);
  
  const balanceBefore = await publicClient.getBalance({
    address: process.env.AGENT_WALLET_ADDRESS as `0x${string}`,
  });
  console.log(`Balance before: ${Number(balanceBefore) / 1e18} ETH`);
  
  await claimVaultAllocation(agentId);
  
  const balanceAfter = await publicClient.getBalance({
    address: process.env.AGENT_WALLET_ADDRESS as `0x${string}`,
  });
  console.log(`Balance after: ${Number(balanceAfter) / 1e18} ETH`);
}
main().catch(console.error);
