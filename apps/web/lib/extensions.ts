import "server-only"

import {
  getActiveContributions,
  listManifests,
  type ExtensionManifest,
  type ExtensionNavContribution,
  type Plan,
} from "@starboard/extension-host"

/** Temporary default until ticket 005 persists org plan. */
export const DEFAULT_ORG_PLAN: Plan = "credit"

export function listRegisteredExtensions(): ExtensionManifest[] {
  return listManifests()
}

export function listActiveExtensionNav(
  plan: Plan = DEFAULT_ORG_PLAN
): ExtensionNavContribution[] {
  return getActiveContributions(plan).nav
}
