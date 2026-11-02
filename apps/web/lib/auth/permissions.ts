// Single source of truth lives in `org.settings` so the package's browser
// client and the kernel's server/client auth share one access-control config.
export {
  ac,
  admin,
  member,
  owner,
} from "@starboard/ext-org-settings/permissions"
