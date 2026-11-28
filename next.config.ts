import type { NextConfig } from "next";

// Static export: Cloudflare Workers serves ./out (see wrangler.jsonc).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
