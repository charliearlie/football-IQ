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
  async redirects() {
    return [
      {
        // Exact match only — sub-routes like /play/career-path are unaffected
        source: "/play",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
