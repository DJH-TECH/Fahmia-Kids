import type { NextConfig } from "next";

// Tailwind via postcss.config.mjs (@tailwindcss/postcss).
const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
