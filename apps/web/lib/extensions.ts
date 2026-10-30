import "server-only"

import {
  DEFAULT_PLAN,
  getActiveContributions,
  listManifests,
  type ExtensionManifest,
  type ExtensionNavContribution,
  type Plan,
} from "@starboard/extension-host"

export const DEFAULT_ORG_PLAN: Plan = DEFAULT_PLAN

export function listRegisteredExtensions(): ExtensionManifest[] {
  return listManifests()
}

export function listActiveExtensionNav(
  plan: Plan = DEFAULT_ORG_PLAN
): ExtensionNavContribution[] {
  return getActiveContributions(plan).nav
}
