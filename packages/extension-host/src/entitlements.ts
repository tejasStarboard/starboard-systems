import { listManifests } from "./registry.js"
import type {
  ExtensionContributes,
  ExtensionManifest,
  ExtensionNavContribution,
  Plan,
} from "./manifest.js"

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

export function isEntitled(manifest: ExtensionManifest, plan: Plan): boolean {
  return manifest.requiredPlan.includes(plan)
}

export function isActive(manifest: ExtensionManifest, plan: Plan): boolean {
  return manifest.enabled === true && isEntitled(manifest, plan)
}

export function listActiveExtensions(
  plan: Plan,
  manifests: ExtensionManifest[] = listManifests()
): ExtensionManifest[] {
  return manifests.filter((manifest) => isActive(manifest, plan))
}

export function getActiveContributions(
  plan: Plan,
  manifests: ExtensionManifest[] = listManifests()
): ActiveContributions {
  const active = listActiveExtensions(plan, manifests)

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
