const numberFromEnv = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const boolFromEnv = (value: string | undefined, fallback = false) => {
  if (!value) {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

function resolveDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct?.startsWith("postgres")) {
    return direct;
  }
  return (
    process.env.STORAGE_PRISMA_DATABASE_URL?.trim() ||
    process.env.STORAGE_POSTGRES_URL?.trim() ||
    ""
  );
}

export const env = {
  databaseUrl: resolveDatabaseUrl(),
  tradingMode: process.env.TRADING_MODE ?? "paper",
  defaultCapitalUsd: numberFromEnv(process.env.DEFAULT_CAPITAL_USD, 10_000),
  prismBaseUrl: process.env.PRISM_API_BASE_URL ?? "https://api.prismapi.ai",
  prismApiKey: process.env.PRISM_API_KEY ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  llmProvider: process.env.LLM_PROVIDER ?? "heuristic",
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
  krakenCliPath: process.env.KRAKEN_CLI_PATH ?? "kraken",
  krakenCliSimulate: boolFromEnv(process.env.KRAKEN_CLI_SIMULATE, true),
  krakenApiKey: process.env.KRAKEN_API_KEY ?? "",
  krakenApiSecret: process.env.KRAKEN_API_SECRET ?? "",
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY ?? "",
  agentWalletAddress: process.env.AGENT_WALLET_ADDRESS ?? "",
  erc8004AgentId: process.env.ERC8004_AGENT_ID ?? "",
};
