import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.js";

const url = process.env.DATABASE_URL;
if (!url?.startsWith("postgres")) {
  console.error("DATABASE_URL must be a postgres:// or postgresql:// URL");
  process.exit(1);
}
console.log("DATABASE_URL set:", url.slice(0, 24), "…");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
try {
  const rows = await prisma.agentConfig.findMany();
  console.log("rows", rows.length);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
