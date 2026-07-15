import type { NextConfig } from "next";

// For GitHub Pages deployment, set BASE_PATH env at build time:
//   BASE_PATH=/your-repo-name bun run build:gh
// This gets prepended to all asset URLs.
const basePath = process.env.BASE_PATH || "";
const isStaticExport = process.env.STATIC_EXPORT === "1" || !!basePath;

const nextConfig: NextConfig = {
  // Only use static export for GitHub Pages builds, NOT in dev
  ...(isStaticExport
    ? {
        output: "export" as const,
        basePath: basePath || undefined,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
};

export default nextConfig;
