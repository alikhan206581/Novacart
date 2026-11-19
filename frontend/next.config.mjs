import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: root,
  async rewrites() {
    const configuredUrl = process.env.BACKEND_API_URL;
    if (!configuredUrl) return [];
    return [{
      source: "/api/:path*",
      destination: `${configuredUrl.replace(/\/+$/, "")}/api/:path*`,
    }];
  },
};
export default nextConfig;
