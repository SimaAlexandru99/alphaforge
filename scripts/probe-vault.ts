import "dotenv/config";
import { publicClient, HACKATHON_VAULT } from "@/lib/onchain/client";
import { HACKATHON_VAULT_ABI } from "@/lib/onchain/abi";

async function main() {
  // Test hasClaimed for multiple IDs including one that can't possibly be claimed
  for (const id of [0n, 45n, 999n, 99999n]) {
    const claimed = await publicClient.readContract({
      address: HACKATHON_VAULT,
      abi: HACKATHON_VAULT_ABI,
      functionName: "hasClaimed",
      args: [id],
    });
    console.log(`hasClaimed(${id}) = ${claimed}`);
  }

  // Try reading raw storage slot 0 and 1
  for (const slot of ["0x0", "0x1", "0x2"]) {
    const val = await publicClient.getStorageAt({
      address: HACKATHON_VAULT,
      slot: slot as `0x${string}`,
    });
    console.log(`slot[${slot}] = ${val}`);
  }
  
  // Try the claimAllocation but simulate first
  try {
    await publicClient.simulateContract({
      address: HACKATHON_VAULT,
      abi: HACKATHON_VAULT_ABI,
      functionName: "claimAllocation",
      args: [45n],
      account: process.env.AGENT_WALLET_ADDRESS as `0x${string}`,
    });
    console.log("Simulation: claimAllocation(45) would succeed!");
  } catch (e) {
    console.log("Simulation error:", e instanceof Error ? e.message.split("\n")[0] : e);
  }
}
main().catch(console.error);
