import type { NextConfig } from "next";

// Kandler is built as a static export so it can be hosted on GitHub Pages
// at https://ddown325.github.io/Kandler/ — basePath matches the repo name.
const isProd = process.env.NODE_ENV === "production";
const repoName = "Kandler";
const basePath = isProd ? `/${repoName}` : "";
const assetPrefix = isProd ? `/${repoName}/` : "";

const nextConfig: NextConfig = {
  // For GitHub Pages we use static export. For dev (`bun run dev`) we keep
  // the normal Next dev server. Toggle via NODE_ENV.
  output: isProd ? "export" : "standalone",
  basePath: basePath || undefined,
  assetPrefix: assetPrefix || undefined,
  // Disable Next/Image optimization for static export on Pages
  images: {
    unoptimized: true,
  },
  // Generate trailing slashes so static asset paths resolve correctly on Pages
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow dev server from preview subdomains
  allowedDevOrigins: ["*.space-z.ai"],
};

export default nextConfig;
