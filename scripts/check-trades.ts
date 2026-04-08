import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const trades = await prisma.trade.findMany({
    where: { status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
  console.log(JSON.stringify(trades, null, 2));
  await prisma.$disconnect();
}
main().catch(console.error);
