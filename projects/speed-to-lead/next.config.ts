import type { NextConfig } from "next";

// Python (FastAPI) functions live in /api. In development they run on uvicorn :8000.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  rewrites: async () => [
    { source: "/api/py/:path*", destination: process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000/api/py/:path*" : "/api/" },
  ],
};
export default nextConfig;
