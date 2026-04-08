import { DECISION_ACTION } from "@/lib/domain";
import { env } from "@/lib/env";
import type { DecisionAction } from "@/lib/generated/prisma/client";
import type {
  AgentConfigInput,
  MarketSignal,
  NormalizedDecision,
} from "@/lib/types";

interface DecisionContext {
  config: AgentConfigInput;
  hasOpenPosition: boolean;
  latestPnl: number;
  signal: MarketSignal;
}

function heuristicDecision(context: DecisionContext): NormalizedDecision {
  const { signal, hasOpenPosition } = context;

  if (
    !hasOpenPosition &&
    signal.rsi <= 35 &&
    signal.trend !== "bearish" &&
    signal.riskScore < 0.75
  ) {
    return {
      action: DECISION_ACTION.BUY,
      reason: `RSI ${signal.rsi.toFixed(1)} is oversold and trend is ${signal.trend}.`,
      confidence: 0.72,
      source: "heuristic",
    };
  }

  if (hasOpenPosition && (signal.rsi >= 65 || signal.trend === "bearish")) {
    return {
      action: DECISION_ACTION.SELL,
      reason: `Exit bias triggered by RSI ${signal.rsi.toFixed(1)} and trend ${signal.trend}.`,
      confidence: 0.74,
      source: "heuristic",
    };
  }

  return {
    action: DECISION_ACTION.HOLD,
    reason: `No high-conviction setup. RSI ${signal.rsi.toFixed(1)}, trend ${signal.trend}, risk ${signal.riskScore.toFixed(2)}.`,
    confidence: 0.58,
    source: "heuristic",
  };
}

export function normalizeDecision(payload: string): NormalizedDecision {
  const rawText = payload.trim();

  try {
    const parsed = JSON.parse(rawText) as {
      action?: string;
      reason?: string;
      confidence?: number;
    };
    const action = String(parsed.action ?? "").toUpperCase();
    if (action === "BUY" || action === "SELL" || action === "HOLD") {
      return {
        action: action as DecisionAction,
        reason: parsed.reason?.trim() || "LLM returned no reason.",
        confidence: Number(parsed.confidence ?? 0.6),
        source: "llm",
        rawText,
      };
    }
  } catch {
    // fall through
  }

  const upper = rawText.toUpperCase();
  let action: DecisionAction | null = null;
  if (upper.includes("BUY")) {
    action = DECISION_ACTION.BUY;
  } else if (upper.includes("SELL")) {
    action = DECISION_ACTION.SELL;
  } else if (upper.includes("HOLD")) {
    action = DECISION_ACTION.HOLD;
  }

  if (!action) {
    throw new Error(`Could not normalize decision payload: ${payload}`);
  }

  return {
    action,
    reason: rawText,
    confidence: 0.55,
    source: "llm",
    rawText,
  };
}

async function requestOpenAiDecision(prompt: string, model: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a crypto trading decision engine. Return strict JSON with keys action, reason, confidence. action must be BUY, SELL, or HOLD.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

async function requestAnthropicDecision(prompt: string, model: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      system:
        "You are a crypto trading decision engine. Return strict JSON with keys action, reason, confidence. action must be BUY, SELL, or HOLD.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed with ${response.status}`);
  }

  const json = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  return json.content?.find((item) => item.type === "text")?.text ?? "";
}

export async function decideTrade(
  context: DecisionContext
): Promise<NormalizedDecision> {
  const prompt = JSON.stringify(
    {
      symbol: context.signal.symbol,
      price: context.signal.price,
      rsi: context.signal.rsi,
      trend: context.signal.trend,
      volatility: context.signal.volatility,
      riskScore: context.signal.riskScore,
      hasOpenPosition: context.hasOpenPosition,
      latestPnl: context.latestPnl,
      guardrails: {
        maxExposurePct: context.config.maxExposurePct,
        stopLossPct: context.config.stopLossPct,
        takeProfitPct: context.config.takeProfitPct,
        maxDrawdownPct: context.config.maxDrawdownPct,
      },
    },
    null,
    2
  );

  try {
    if (context.config.llmProvider === "openai" && env.openAiApiKey) {
      return normalizeDecision(
        await requestOpenAiDecision(prompt, context.config.llmModel)
      );
    }

    if (context.config.llmProvider === "anthropic" && env.anthropicApiKey) {
      return normalizeDecision(
        await requestAnthropicDecision(prompt, context.config.llmModel)
      );
    }
  } catch {
    // fall back to heuristic
  }

  return heuristicDecision(context);
}
