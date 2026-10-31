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
  type RolloutContext,
} from "./entitlements.js"

export {
  isRolloutAllowed,
  parseRolloutMode,
  type ExtensionRolloutState,
  type RolloutMode,
} from "./rollout.js"

export { DEFAULT_PLAN, parsePlan } from "./plan.js"
