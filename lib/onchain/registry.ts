import { keccak256, toBytes } from "viem";
import {
  AGENT_REGISTRY_ABI,
  HACKATHON_VAULT_ABI,
  REPUTATION_REGISTRY_ABI,
  RISK_ROUTER_ABI,
  VALIDATION_REGISTRY_ABI,
} from "./abi";
import {
  AGENT_REGISTRY,
  getWalletClient,
  HACKATHON_VAULT,
  publicClient,
  REPUTATION_REGISTRY,
  RISK_ROUTER,
  VALIDATION_REGISTRY,
} from "./client";

const AGENT_URI =
  "https://raw.githubusercontent.com/SimaAlexandru99/kraken-hackathon/master/public/agent-registration.json";

const AGENT_NAME = "Kraken AI Trader";
const AGENT_DESCRIPTION =
  "Autonomous trading agent that uses PRISM market signals and LLM decision-making to execute paper trades on Kraken.";
const AGENT_CAPABILITIES = ["trading", "market-analysis", "risk-management"];

// Cached agentId after first registration
let cachedAgentId: bigint | null = null;

export async function getOrRegisterAgent(): Promise<bigint> {
  if (cachedAgentId !== null) {
    return cachedAgentId;
  }

  const stored = process.env.ERC8004_AGENT_ID;
  if (stored) {
    cachedAgentId = BigInt(stored);
    return cachedAgentId;
  }

  const { client, account } = getWalletClient();

  const hash = await client.writeContract({
    address: AGENT_REGISTRY,
    abi: AGENT_REGISTRY_ABI,
    functionName: "register",
    args: [
      account.address,
      AGENT_NAME,
      AGENT_DESCRIPTION,
      AGENT_CAPABILITIES,
      AGENT_URI,
    ],
    account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Parse agentId from AgentRegistered event (topics[1] = agentId indexed)
  const log = receipt.logs[0];
  const agentId = log?.topics[1] ? BigInt(log.topics[1]) : BigInt(1);

  cachedAgentId = agentId;
  console.log(`[ERC-8004] Agent registered: agentId=${agentId} tx=${hash}`);
  return agentId;
}

export async function claimVaultAllocation(agentId: bigint) {
  try {
    const alreadyClaimed = await publicClient.readContract({
      address: HACKATHON_VAULT,
      abi: HACKATHON_VAULT_ABI,
      functionName: "hasClaimed",
      args: [agentId],
    });

    if (alreadyClaimed) {
      console.log("[ERC-8004] Vault already claimed for agentId=%s", agentId);
      return;
    }

    const { client, account } = getWalletClient();
    const hash = await client.writeContract({
      address: HACKATHON_VAULT,
      abi: HACKATHON_VAULT_ABI,
      functionName: "claimAllocation",
      args: [agentId],
      account,
    });

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("[ERC-8004] Vault allocation claimed tx=%s", hash);
  } catch (error) {
    console.warn(
      "[ERC-8004] Vault claim failed:",
      error instanceof Error ? error.message : error
    );
  }
}

/** Submit a signed TradeIntent to RiskRouter before each BUY/SELL */
export async function submitTradeIntent(params: {
  agentId: bigint;
  pair: string;
  action: string;
  amountUsd: number;
  maxSlippageBps?: number;
}): Promise<boolean> {
  try {
    const { client, account } = getWalletClient();

    const nonce = await publicClient.readContract({
      address: RISK_ROUTER,
      abi: RISK_ROUTER_ABI,
      functionName: "getIntentNonce",
      args: [params.agentId],
    });

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min

    const intent = {
      agentId: params.agentId,
      agentWallet: account.address,
      pair: params.pair,
      action: params.action,
      amountUsdScaled: BigInt(Math.round(params.amountUsd * 1e6)),
      maxSlippageBps: BigInt(params.maxSlippageBps ?? 50),
      nonce,
      deadline,
    } as const;

    // EIP-712 domain for RiskRouter on Sepolia (chainId=11155111)
    const domain = {
      name: "RiskRouter",
      version: "1",
      chainId: 11_155_111,
      verifyingContract: RISK_ROUTER,
    } as const;

    const types = {
      TradeIntent: [
        { name: "agentId", type: "uint256" },
        { name: "agentWallet", type: "address" },
        { name: "pair", type: "string" },
        { name: "action", type: "string" },
        { name: "amountUsdScaled", type: "uint256" },
        { name: "maxSlippageBps", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    } as const;

    const signature = await client.signTypedData({
      account,
      domain,
      types,
      primaryType: "TradeIntent",
      message: intent,
    });

    // Simulate first
    const [valid, reason] = await publicClient.readContract({
      address: RISK_ROUTER,
      abi: RISK_ROUTER_ABI,
      functionName: "simulateIntent",
      args: [intent],
    });

    if (!valid) {
      console.warn("[ERC-8004] TradeIntent rejected by RiskRouter:", reason);
      return false;
    }

    const hash = await client.writeContract({
      address: RISK_ROUTER,
      abi: RISK_ROUTER_ABI,
      functionName: "submitTradeIntent",
      args: [intent, signature],
      account,
    });

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("[ERC-8004] TradeIntent submitted tx=%s", hash);
    return true;
  } catch (error) {
    console.warn(
      "[ERC-8004] TradeIntent failed:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

export async function postCheckpoint(params: {
  agentId: bigint;
  action: string;
  symbol: string;
  reason: string;
  confidence: number;
  score?: number;
}) {
  try {
    const { client, account } = getWalletClient();

    const payload = JSON.stringify({
      action: params.action,
      symbol: params.symbol,
      reason: params.reason,
      confidence: params.confidence,
      timestamp: new Date().toISOString(),
    });

    const checkpointHash = keccak256(toBytes(payload));
    const score = Math.min(
      255,
      Math.max(0, Math.round((params.score ?? params.confidence) * 100))
    );

    await client.writeContract({
      address: VALIDATION_REGISTRY,
      abi: VALIDATION_REGISTRY_ABI,
      functionName: "postEIP712Attestation",
      args: [
        params.agentId,
        checkpointHash,
        score,
        `${params.action} ${params.symbol}: ${params.reason.slice(0, 200)}`,
      ],
      account,
    });
  } catch (error) {
    console.warn(
      "[ERC-8004] Checkpoint post failed:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function postTradeFeedback(params: {
  agentId: bigint;
  pnlUsd: number;
  action: string;
  symbol: string;
}) {
  try {
    const { client, account } = getWalletClient();

    // score 0-100 based on PnL: 50 is neutral, above=profitable, below=loss
    const rawScore = 50 + Math.round(params.pnlUsd * 5);
    const score = Math.min(100, Math.max(0, rawScore));

    const outcomeRef = keccak256(
      toBytes(`${params.action}:${params.symbol}:${Date.now()}`)
    );

    await client.writeContract({
      address: REPUTATION_REGISTRY,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "submitFeedback",
      args: [
        params.agentId,
        score,
        outcomeRef,
        `${params.action} ${params.symbol} PnL=${params.pnlUsd.toFixed(2)} USD`,
        0, // feedbackType: 0 = trading outcome
      ],
      account,
    });
  } catch (error) {
    console.warn(
      "[ERC-8004] Feedback post failed:",
      error instanceof Error ? error.message : error
    );
  }
}

// Keep backward compat alias used in loop.ts
export const postValidationRequest = postCheckpoint;
