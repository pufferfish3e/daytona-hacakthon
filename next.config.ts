import type { NextConfig } from "next";

const demoPreviewPort = process.env.DEMO_PREVIEW_PORT ?? "5174";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/preview/live",
        destination: `http://localhost:${demoPreviewPort}/`,
      },
      {
        source: "/preview/live/:path*",
        destination: `http://localhost:${demoPreviewPort}/:path*`,
      },
    ];
  },
};

export default nextConfig;
