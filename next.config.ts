import type { NextConfig } from "next";
const nextConfig: NextConfig = { typedRoutes: false, turbopack: { root: process.cwd() }, experimental: { serverActions: { bodySizeLimit: "8mb" } } };
export default nextConfig;
