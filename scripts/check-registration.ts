import "dotenv/config";
import { AGENT_REGISTRY_ABI, HACKATHON_VAULT_ABI } from "@/lib/onchain/abi";
import {
  AGENT_REGISTRY,
  HACKATHON_VAULT,
  publicClient,
} from "@/lib/onchain/client";

async function main() {
  const _agentWallet = process.env.AGENT_WALLET_ADDRESS as `0x${string}`;

  // Check the tx receipt for the registration
  const txHash =
    "0x97a063dac84108e8eaa578f1e6ddc79bb6cd6a6a259792a20f49c6ed79253eeb";
  const receipt = await publicClient.getTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  console.log("Receipt status:", receipt.status);
  console.log("Logs count:", receipt.logs.length);
  receipt.logs.forEach((log, i) => {
    console.log(`Log[${i}]:`, {
      address: log.address,
      topics: log.topics,
      data: log.data,
    });
  });

  // Check agentId 0 and 1
  for (const id of [0n, 1n, 2n]) {
    try {
      const registered = await publicClient.readContract({
        address: AGENT_REGISTRY,
        abi: AGENT_REGISTRY_ABI,
        functionName: "isRegistered",
        args: [id],
      });
      const claimed = await publicClient.readContract({
        address: HACKATHON_VAULT,
        abi: HACKATHON_VAULT_ABI,
        functionName: "hasClaimed",
        args: [id],
      });
      const balance = await publicClient.readContract({
        address: HACKATHON_VAULT,
        abi: HACKATHON_VAULT_ABI,
        functionName: "getBalance",
        args: [id],
      });
      console.log(
        `agentId=${id}: registered=${registered} vaultClaimed=${claimed} vaultBalance=${balance}`
      );
    } catch (e) {
      console.log(`agentId=${id}: error -`, e instanceof Error ? e.message : e);
    }
  }
}
main().catch(console.error);
