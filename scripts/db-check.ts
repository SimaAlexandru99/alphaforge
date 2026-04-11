import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("postgres")) {
    throw new Error("DATABASE_URL must be a postgres:// or postgresql:// URL");
  }
  console.log("DATABASE_URL set:", url.slice(0, 24), "…");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  const rows = await prisma.agentConfig.findMany();
  console.log("rows", rows.length);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
