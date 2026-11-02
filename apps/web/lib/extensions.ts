import "server-only"

import {
  DEFAULT_PLAN,
  EMPTY_WORKBENCH_CONTRIBUTIONS,
  getActiveContributions,
  getActiveWorkbenchContributions,
  getContributionsForOwner,
  getContributionsToPoint,
  isActive,
  listManifests,
  type ActiveWorkbenchContributions,
  type ExtensionManifest,
  type ExtensionNavContribution,
  type Plan,
} from "@starboard/ext-host"

import { loadRolloutContext } from "@/lib/extensions-rollout"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"

export const DEFAULT_ORG_PLAN: Plan = DEFAULT_PLAN

export function listRegisteredExtensions(): ExtensionManifest[] {
  return listManifests()
}

function logRolloutFailure(error: unknown) {
  console.error("[extensions] getRolloutMap failed; failing closed", error)
}

async function rolloutContext(organizationId: string) {
  return loadRolloutContext(
    organizationId,
    () => getPlatformManager().getRolloutMap(),
    logRolloutFailure
  )
}

export async function listActiveExtensionNav(
  plan: Plan,
  organizationId: string
): Promise<ExtensionNavContribution[]> {
  const context = await rolloutContext(organizationId)
  if (!context) {
    return []
  }
  return getActiveContributions(plan, listManifests(), context).nav
}

/** Workbench activity/views/editors/commands + defined-point contributions. Fails closed. */
export async function listActiveWorkbenchContributions(
  plan: Plan,
  organizationId: string
): Promise<ActiveWorkbenchContributions> {
  const context = await rolloutContext(organizationId)
  if (!context) {
    return EMPTY_WORKBENCH_CONTRIBUTIONS
  }
  return getActiveWorkbenchContributions(plan, listManifests(), context)
}

/** Contributions to an extension-defined point; empty when its owner is inactive. */
export async function listActivePointContributions(
  pointId: string,
  plan: Plan,
  organizationId: string
) {
  const context = await rolloutContext(organizationId)
  if (!context) {
    return []
  }
  return getContributionsToPoint(pointId, plan, listManifests(), context)
}

export async function listActiveUiSlots(
  plan: Plan,
  organizationId: string
): Promise<string[]> {
  const context = await rolloutContext(organizationId)
  if (!context) {
    return []
  }
  return getActiveContributions(plan, listManifests(), context).uiSlots
}

/**
 * Active contributions to every point owned by `ownerId` (keyed by point id).
 * Generic: callers pass an owner extension id; the kernel never names slots.
 * Empty when the owner is inactive / rollout unavailable (fails closed).
 */
export async function listActiveOwnerPointContributions(
  ownerId: string,
  plan: Plan,
  organizationId: string
) {
  const context = await rolloutContext(organizationId)
  if (!context) {
    return {}
  }
  return getContributionsForOwner(ownerId, plan, listManifests(), context)
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
  if (!context) {
    return false
  }
  return isActive(manifest, plan, context)
}
