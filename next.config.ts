import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_ANALYTICS_TIME_ZONE: process.env.ANALYTICS_TIME_ZONE ?? "Asia/Taipei",
  },
};

export default nextConfig;
