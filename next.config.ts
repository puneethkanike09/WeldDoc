import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Minimal production bundle for Docker (copies only traced deps into .next/standalone).
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    serverActions: {
      // NDT step can upload multiple report PDFs in one form submit.
      bodySizeLimit: "25mb",
    },
    // Next 15/16 defaults the client Router Cache for dynamic routes to 0s,
    // so every back/forward nav re-fetches and re-shows the loading skeleton.
    // Keep visited pages warm for a short window so revisits feel instant.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  serverExternalPackages: ["@react-pdf/renderer", "node-cron", "razorpay"],
};

export default nextConfig;
