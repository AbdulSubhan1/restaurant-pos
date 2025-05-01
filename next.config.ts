import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // External packages that should only be used on the server
  serverExternalPackages: ["jsonwebtoken", "bcrypt"],

  // This ensures our middleware works correctly without trying to use Node.js modules
  // in the Edge Runtime
  skipMiddlewareUrlNormalize: false,
};

export default nextConfig;
