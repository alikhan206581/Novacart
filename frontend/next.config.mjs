import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: root,
  async rewrites() {
    const configuredUrl = process.env.BACKEND_API_URL;
    const backendUrl = configuredUrl || (process.env.VERCEL ? null : "http://localhost:3001");
    if (!backendUrl) throw new Error("BACKEND_API_URL must be set for Vercel deployments.");
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendUrl.replace(/\/+$/, "")}/api/:path*`,
        },
      ],
    };
  },
};
export default nextConfig;
