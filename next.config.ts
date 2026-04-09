import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the SQLite DB with serverless functions on Vercel
  outputFileTracingIncludes: {
    "**": ["./prisma/dev.db"],
  },
};

export default nextConfig;
