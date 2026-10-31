import "server-only"

import {
  DEFAULT_PLAN,
  getActiveContributions,
  isActive,
  listActiveExtensions,
  listManifests,
  type ExtensionManifest,
  type ExtensionNavContribution,
  type Plan,
} from "@starboard/extension-host"

import type { SpotRateSource } from "@/lib/spot-rate-source"

export const DEFAULT_ORG_PLAN: Plan = DEFAULT_PLAN

export type { SpotRateSource }

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

export function listActiveSpotRateSources(
  plan: Plan = DEFAULT_ORG_PLAN
): SpotRateSource[] {
  return listActiveExtensions(plan)
    .filter(
      (manifest) =>
        manifest.contributes.uiSlots?.includes("quote.rateSources") ||
        manifest.contributes.jobs?.some((job) => job.type === "spot.search")
    )
    .map((manifest) => {
      const searchJob = manifest.contributes.jobs?.find(
        (job) => job.type === "spot.search"
      )
      return {
        id: manifest.id,
        displayName: manifest.displayName,
        carrier: searchJob?.carrier,
      }
    })
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
