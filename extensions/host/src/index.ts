export {
  extensionManifestSchema,
  extensionContributesSchema,
  extensionNavContributionSchema,
  extensionJobContributionSchema,
  extensionApiContributionSchema,
  extensionSettingContributionSchema,
  extensionSettingTypeSchema,
  extensionWorkerSchema,
  planSchema,
  type ExtensionManifest,
  type ExtensionContributes,
  type ExtensionNavContribution,
  type ExtensionSettingContribution,
  type ExtensionSettingType,
  type Plan,
} from "./manifest.js"

export {
  getDeclaredSettings,
  resolveExtensionSettingValues,
  resolveStaffSettings,
  validateSettingValues,
  type StaffSettingView,
  type StoredExtensionSetting,
} from "./settings.js"

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
