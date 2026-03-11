import { NextConfig } from "next";
import "./src/lib/settings/env";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactCompiler: true,
  // Prevent Node.js-only packages from being bundled into client/edge bundles.
  serverExternalPackages: ["postgres", "drizzle-orm", "pino", "pino-pretty"],
  images: {
    remotePatterns: [
      {
        // GitHub OAuth avatars
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        // Cloudinary — service logos and media uploads
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};
export default nextConfig;
