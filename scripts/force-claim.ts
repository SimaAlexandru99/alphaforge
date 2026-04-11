import "dotenv/config";
import { publicClient, HACKATHON_VAULT, getWalletClient } from "@/lib/onchain/client";
import { HACKATHON_VAULT_ABI } from "@/lib/onchain/abi";

async function main() {
  const agentId = BigInt(45);
  const { client, account } = getWalletClient();

  console.log("Calling claimAllocation(45) directly...");
  try {
    const hash = await client.writeContract({
      address: HACKATHON_VAULT,
      abi: HACKATHON_VAULT_ABI,
      functionName: "claimAllocation",
      args: [agentId],
      account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("tx status:", receipt.status, "hash:", hash);
    
    const balance = await publicClient.getBalance({ address: account.address });
    console.log("New balance:", Number(balance) / 1e18, "ETH");
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
  }
}
main().catch(console.error);
