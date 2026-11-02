import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@starboard/lib-ui",
    "@starboard/ext-quoting-document",
    "@starboard/ext-crm-parties",
    "@starboard/ext-geo-gazetteer",
    "@starboard/ext-org-settings",
  ],
}

export default nextConfig
