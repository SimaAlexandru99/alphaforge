import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

// Hackathon shared contracts on Sepolia
export const AGENT_REGISTRY =
  "0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3" as const;
export const HACKATHON_VAULT =
  "0x0E7CD8ef9743FEcf94f9103033a044caBD45fC90" as const;
export const RISK_ROUTER =
  "0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC" as const;
export const REPUTATION_REGISTRY =
  "0x423a9904e39537a9997fbaF0f220d79D7d545763" as const;
export const VALIDATION_REGISTRY =
  "0x92bF63E5C7Ac6980f237a7164Ab413BE226187F1" as const;

const rpc = process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpc),
});

export function getWalletClient() {
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("AGENT_PRIVATE_KEY not set");
  }
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return {
    client: createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpc),
    }),
    account,
  };
}
