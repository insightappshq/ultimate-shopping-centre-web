import type { NextConfig } from "next";
import { OPTIMIZED_IMAGE_HOSTS } from "./src/config/image-hosts";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Live prices move often; these lifetimes balance freshness against API credits.
  cacheLife: {
    search: { stale: 120, revalidate: 600, expire: 3600 },
    product: { stale: 60, revalidate: 300, expire: 1800 },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
