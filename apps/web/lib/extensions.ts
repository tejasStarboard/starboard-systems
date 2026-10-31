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

import { getPlatformManager } from "@/lib/domain/platform/platform.manager"
import type { SpotRateSource } from "@/lib/spot-rate-source"

export const DEFAULT_ORG_PLAN: Plan = DEFAULT_PLAN

export type { SpotRateSource }

export function listRegisteredExtensions(): ExtensionManifest[] {
  return listManifests()
}

async function rolloutContext(organizationId: string) {
  const rollouts = await getPlatformManager().getRolloutMap()
  return { organizationId, rollouts }
}

export async function listActiveExtensionNav(
  plan: Plan,
  organizationId: string
): Promise<ExtensionNavContribution[]> {
  const context = await rolloutContext(organizationId)
  return getActiveContributions(plan, listManifests(), context).nav
}

export async function listActiveUiSlots(
  plan: Plan,
  organizationId: string
): Promise<string[]> {
  const context = await rolloutContext(organizationId)
  return getActiveContributions(plan, listManifests(), context).uiSlots
}

export async function listActiveSpotRateSources(
  plan: Plan,
  organizationId: string
): Promise<SpotRateSource[]> {
  const context = await rolloutContext(organizationId)
  return listActiveExtensions(plan, listManifests(), context)
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

export async function isExtensionActive(
  extensionId: string,
  plan: Plan,
  organizationId: string
): Promise<boolean> {
  const manifest = listManifests().find((item) => item.id === extensionId)
  if (!manifest) {
    return false
  }
  const context = await rolloutContext(organizationId)
  return isActive(manifest, plan, context)
}
