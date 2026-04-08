import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client.js";

console.log("DATABASE_URL", process.env.DATABASE_URL);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});
try {
  const rows = await prisma.agentConfig.findMany();
  console.log("rows", rows.length);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
