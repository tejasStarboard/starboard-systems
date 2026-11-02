export {
  extensionManifestSchema,
  extensionContributesSchema,
  extensionNavContributionSchema,
  extensionJobContributionSchema,
  extensionApiContributionSchema,
  extensionActivityContributionSchema,
  extensionViewContributionSchema,
  extensionEditorContributionSchema,
  extensionCommandContributionSchema,
  extensionPointContributionSchema,
  extensionPointDefinitionSchema,
  extensionDefinesSchema,
  isKernelPointId,
  KERNEL_POINT_PREFIXES,
  extensionSettingContributionSchema,
  extensionSettingTypeSchema,
  extensionWorkerSchema,
  planSchema,
  type ExtensionManifest,
  type ExtensionContributes,
  type ExtensionNavContribution,
  type ExtensionActivityContribution,
  type ExtensionViewContribution,
  type ExtensionEditorContribution,
  type ExtensionCommandContribution,
  type ExtensionPointContribution,
  type ExtensionPointDefinition,
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

export {
  EMPTY_WORKBENCH_CONTRIBUTIONS,
  getActiveWorkbenchContributions,
  getContributionsToPoint,
  resolveActivePointOwner,
  resolvePointOwner,
  type ActiveWorkbenchContributions,
  type WithExtensionId,
} from "./workbench.js"

export { getPointDefiners, validateManifestSet } from "./validate.js"
