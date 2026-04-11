import "dotenv/config";
import { publicClient, HACKATHON_VAULT, AGENT_REGISTRY } from "@/lib/onchain/client";

async function main() {
  const vaultBal = await publicClient.getBalance({ address: HACKATHON_VAULT });
  console.log("Vault ETH balance:", Number(vaultBal) / 1e18, "ETH");

  const agentBal = await publicClient.getBalance({ address: AGENT_REGISTRY });
  console.log("AgentRegistry ETH balance:", Number(agentBal) / 1e18, "ETH");

  const walletBal = await publicClient.getBalance({
    address: process.env.AGENT_WALLET_ADDRESS as `0x${string}`,
  });
  console.log("Agent wallet balance:", Number(walletBal) / 1e18, "ETH");
}
main().catch(console.error);
