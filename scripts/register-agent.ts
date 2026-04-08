import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  claimVaultAllocation,
  getOrRegisterAgent,
} from "@/lib/onchain/registry";

async function main() {
  console.log("[ERC-8004] Registering agent on Sepolia...");
  const agentId = await getOrRegisterAgent();
  console.log(`[ERC-8004] Done! agentId=${agentId}`);
  console.log(`Add to .env: ERC8004_AGENT_ID="${agentId}"`);

  // Update public/agent-registration.json with real agentId
  const jsonPath = join(process.cwd(), "public", "agent-registration.json");
  const registration = JSON.parse(readFileSync(jsonPath, "utf-8"));
  registration.registrations[0].agentId = Number(agentId);
  writeFileSync(jsonPath, `${JSON.stringify(registration, null, 2)}\n`);
  console.log(
    "[ERC-8004] Updated public/agent-registration.json with agentId=%s",
    agentId
  );

  console.log("[ERC-8004] Claiming vault allocation (0.05 ETH)...");
  await claimVaultAllocation(agentId);
  console.log("[ERC-8004] Done!");
}

main().catch(console.error);
