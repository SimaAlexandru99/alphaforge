import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  // Paper wallet has 0.04542900 ETH; update open ETHUSD trade to match
  const result = await prisma.trade.updateMany({
    where: { symbol: "ETHUSD", status: "OPEN" },
    data: { quantity: 0.045_429 },
  });
  console.log(`Updated ${result.count} ETHUSD trade(s) quantity to 0.04542900`);
  await prisma.$disconnect();
}
main().catch(console.error);
