import type { NextConfig } from "next";

const configuredApiBaseUrl = process.env.API_BASE_URL?.trim();
const apiBaseUrl =
  configuredApiBaseUrl ||
  (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");

if (!apiBaseUrl) {
  throw new Error(
    "Missing API_BASE_URL for production build. Refusing to proxy /api to localhost in production."
  );
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
