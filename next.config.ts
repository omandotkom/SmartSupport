import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "node-llama-cpp",
    "@xenova/transformers",
    "vectra",
    "gpt-3-encoder",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Force these ESM/native packages to not be bundled by webpack
      config.externals = config.externals || [];
      config.externals.push(
        "node-llama-cpp",
        "@xenova/transformers",
        "vectra",
        "gpt-3-encoder",
      );
    }
    return config;
  },
};

export default nextConfig;
