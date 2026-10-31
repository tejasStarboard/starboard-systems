import { listManifests } from "./registry.js"
import type {
  ExtensionContributes,
  ExtensionManifest,
  ExtensionNavContribution,
  Plan,
} from "./manifest.js"
import { isRolloutAllowed, type ExtensionRolloutState } from "./rollout.js"

type ExtensionJobContribution = NonNullable<
  ExtensionContributes["jobs"]
>[number]
type ExtensionApiContribution = NonNullable<ExtensionContributes["api"]>[number]

export type ActiveContributions = {
  nav: ExtensionNavContribution[]
  jobs: ExtensionJobContribution[]
  api: ExtensionApiContribution[]
  uiSlots: string[]
}

/** Optional staff rollout layer: activation = rollout ∩ enabled ∩ entitled. */
export type RolloutContext = {
  organizationId: string
  rollouts: ReadonlyMap<string, ExtensionRolloutState>
}

export function isEntitled(manifest: ExtensionManifest, plan: Plan): boolean {
  return manifest.requiredPlan.includes(plan)
}

export function isActive(
  manifest: ExtensionManifest,
  plan: Plan,
  rolloutContext?: RolloutContext
): boolean {
  if (manifest.enabled !== true || !isEntitled(manifest, plan)) {
    return false
  }
  if (!rolloutContext) {
    return true
  }
  return isRolloutAllowed(
    rolloutContext.rollouts.get(manifest.id),
    rolloutContext.organizationId
  )
}

export function listActiveExtensions(
  plan: Plan,
  manifests: ExtensionManifest[] = listManifests(),
  rolloutContext?: RolloutContext
): ExtensionManifest[] {
  return manifests.filter((manifest) =>
    isActive(manifest, plan, rolloutContext)
  )
}

export function getActiveContributions(
  plan: Plan,
  manifests: ExtensionManifest[] = listManifests(),
  rolloutContext?: RolloutContext
): ActiveContributions {
  const active = listActiveExtensions(plan, manifests, rolloutContext)

  const nav: ExtensionNavContribution[] = []
  const jobs: ExtensionJobContribution[] = []
  const api: ExtensionApiContribution[] = []
  const uiSlots: string[] = []

  for (const manifest of active) {
    if (manifest.contributes.nav) {
      nav.push(...manifest.contributes.nav)
    }
    if (manifest.contributes.jobs) {
      jobs.push(...manifest.contributes.jobs)
    }
    if (manifest.contributes.api) {
      api.push(...manifest.contributes.api)
    }
    if (manifest.contributes.uiSlots) {
      uiSlots.push(...manifest.contributes.uiSlots)
    }
  }

  return { nav, jobs, api, uiSlots }
}
