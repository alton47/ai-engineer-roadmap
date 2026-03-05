import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - Ignore type error if NextConfig hasn't updated its types yet
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
