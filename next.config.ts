import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack/Next don't mis-detect it from a
  // stray package-lock.json in a parent directory (e.g. C:\Users\user).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
