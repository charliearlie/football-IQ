import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack for faster development
  // Already enabled via --turbopack flag in dev script
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
};

export default nextConfig;
