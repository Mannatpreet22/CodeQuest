import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove these in production - only for development
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Modern Next.js optimizations
  experimental: {
    optimizePackageImports: ['react-icons', '@clerk/nextjs'],
  },
  // Enable static exports for better performance where possible
  trailingSlash: false,
};

export default nextConfig;
