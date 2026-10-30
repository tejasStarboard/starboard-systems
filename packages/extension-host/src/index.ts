export {
  extensionManifestSchema,
  extensionContributesSchema,
  extensionNavContributionSchema,
  extensionJobContributionSchema,
  extensionApiContributionSchema,
  extensionWorkerSchema,
  planSchema,
  type ExtensionManifest,
  type ExtensionContributes,
  type ExtensionNavContribution,
  type Plan,
} from "./manifest.js"

export { extensionRegistry, listManifests } from "./registry.js"

export {
  isEntitled,
  isActive,
  listActiveExtensions,
  getActiveContributions,
  type ActiveContributions,
} from "./entitlements.js"
