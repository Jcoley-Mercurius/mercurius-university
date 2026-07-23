import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mercurius/domain", "@mercurius/db"],
};

export default nextConfig;
