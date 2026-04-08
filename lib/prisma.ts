import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { env } from "@/lib/env";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: env.databaseUrl,
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
