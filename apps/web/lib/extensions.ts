import "server-only"

import {
  DEFAULT_PLAN,
  getActiveContributions,
  isActive,
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

export function listActiveUiSlots(plan: Plan = DEFAULT_ORG_PLAN): string[] {
  return getActiveContributions(plan).uiSlots
}

export function isExtensionActive(
  extensionId: string,
  plan: Plan = DEFAULT_ORG_PLAN
): boolean {
  const manifest = listManifests().find((item) => item.id === extensionId)
  if (!manifest) {
    return false
  }
  return isActive(manifest, plan)
}
