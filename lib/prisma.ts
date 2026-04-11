import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { env } from "@/lib/env";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

// On Vercel, the bundled DB is in a read-only layer. Copy it to /tmp (writable)
// on cold start so writes succeed. /tmp is ephemeral per function instance, which
// is fine for a demo — each cold start gets a fresh copy of the seeded DB.
function resolveDbUrl(): string {
  if (process.env.VERCEL !== "1") {
    return env.databaseUrl;
  }
  const tmpPath = "/tmp/dev.db";
  if (!fs.existsSync(tmpPath)) {
    // Try multiple candidate paths — outputFileTracingIncludes places the file
    // relative to the function root, but the exact location can vary.
    const candidates = [
      path.join(process.cwd(), "prisma/dev.db"),
      path.join(process.cwd(), ".next/server/prisma/dev.db"),
      "/var/task/prisma/dev.db",
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) {
      fs.copyFileSync(found, tmpPath);
      console.log(`[prisma] copied DB from ${found} to ${tmpPath}`);
    } else {
      console.error(
        `[prisma] bundled DB not found; tried: ${candidates.join(", ")}`
      );
    }
  }
  return "file:/tmp/dev.db";
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: resolveDbUrl(),
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
