import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Bu ayar, build sırasında ESLint hatalarını yoksayar.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
