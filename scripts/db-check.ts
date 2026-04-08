import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

async function main() {
  console.log("DATABASE_URL", process.env.DATABASE_URL);
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    }),
  });
  const rows = await prisma.agentConfig.findMany();
  console.log("rows", rows.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
