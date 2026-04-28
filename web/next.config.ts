import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't infer the wrong one when
  // multiple lockfiles exist (e.g. ~/bun.lockb + the React Native app's
  // package-lock.json + this web/ tree). Without this, Next falls back to
  // wasm SWC and crashes with `turbo.createProject is not supported by the
  // wasm bindings`.
  turbopack: {
    root: path.resolve("."),
  },
  // Enable Turbopack for faster development
  // Already enabled via --turbopack flag in dev script
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
