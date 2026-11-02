import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@starboard/lib-ui", "@starboard/ext-quoting-document"],
}

export default nextConfig
