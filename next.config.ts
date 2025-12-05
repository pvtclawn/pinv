import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "thread-stream"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
