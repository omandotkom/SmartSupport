import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "node-llama-cpp",
    "@xenova/transformers",
    "vectra",
    "gpt-3-encoder",
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
