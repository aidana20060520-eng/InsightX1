import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 rejects "*" — list explicit dev origins (browser preview proxies via 127.0.0.1)
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.123.39"],
};

export default nextConfig;
