import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@starboard/lib-ui",
    "@starboard/ext-quoting-document",
    "@starboard/ext-crm-parties",
    "@starboard/ext-geo-gazetteer",
    "@starboard/ext-org-settings",
    "@starboard/ext-quoting-charges",
    "@starboard/ext-quoting-email",
    "@starboard/ext-quoting-incoterm",
    "@starboard/ext-quoting-markup",
    "@starboard/ext-quoting-pdf",
    "@starboard/ext-rates-catalog",
  ],
}

export default nextConfig
