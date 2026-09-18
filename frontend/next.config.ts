import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Produces minimal containerized standalone build
  reactStrictMode: true,
  poweredByHeader: false, // Security header hygiene: eliminates X-Powered-By
};

export default nextConfig;
