import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = env.databaseUrl;
  if (!url?.startsWith("postgres")) {
    throw new Error(
      "[prisma] DATABASE_URL must be a PostgreSQL URL (postgres:// or postgresql://). " +
        "Use Prisma Postgres, Neon, or `docker compose up` and set DATABASE_URL in .env " +
        "(or STORAGE_PRISMA_DATABASE_URL from Vercel — see scripts/sync-vercel-production-env.cjs)."
    );
  }

  const adapter = new PrismaPg({ connectionString: url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getOrCreatePrisma(): PrismaClient {
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }
  const client = createPrismaClient();
  globalThis.prismaGlobal = client;
  return client;
}

/** Lazy proxy so importing this module does not connect until first use (helps tooling). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getOrCreatePrisma();
    const value = Reflect.get(client, prop as keyof PrismaClient, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
