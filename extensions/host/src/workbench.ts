import { isActive, type RolloutContext } from "./entitlements.js"
import type {
  ExtensionActivityContribution,
  ExtensionCommandContribution,
  ExtensionEditorContribution,
  ExtensionManifest,
  ExtensionPointContribution,
  ExtensionViewContribution,
  Plan,
} from "./manifest.js"
import { listManifests } from "./registry.js"
import { getPointDefiners } from "./validate.js"

/** Every active contribution carries the contributing extension id. */
export type WithExtensionId<T> = T & { extensionId: string }

export type ActiveWorkbenchContributions = {
  activity: WithExtensionId<ExtensionActivityContribution>[]
  views: WithExtensionId<ExtensionViewContribution>[]
  editors: WithExtensionId<ExtensionEditorContribution>[]
  commands: WithExtensionId<ExtensionCommandContribution>[]
  /** Contributions to extension-defined points, keyed by point id. */
  points: Record<string, WithExtensionId<ExtensionPointContribution>[]>
}

export const EMPTY_WORKBENCH_CONTRIBUTIONS: ActiveWorkbenchContributions = {
  activity: [],
  views: [],
  editors: [],
  commands: [],
  points: {},
}

/**
 * Who owns point X? The single manifest that `defines` it, regardless of
 * activation. `null` when undefined or ambiguous (fail closed).
 */
export function resolvePointOwner(
  pointId: string,
  manifests: ExtensionManifest[] = listManifests()
): ExtensionManifest | null {
  const owners = getPointDefiners(manifests).get(pointId)
  if (!owners || owners.length !== 1) {
    return null
  }
  return manifests.find((manifest) => manifest.id === owners[0]) ?? null
}

/** Owner of point X only when that owner is active; otherwise `null`. */
export function resolveActivePointOwner(
  pointId: string,
  plan: Plan,
  manifests: ExtensionManifest[] = listManifests(),
  rolloutContext?: RolloutContext
): ExtensionManifest | null {
  const owner = resolvePointOwner(pointId, manifests)
  return owner && isActive(owner, plan, rolloutContext) ? owner : null
}

/**
 * Contributions to a defined point. Fails closed: empty when the point is
 * undefined/ambiguous or its owning extension is inactive, regardless of
 * whether the contributor itself is active.
 */
export function getContributionsToPoint(
  pointId: string,
  plan: Plan,
  manifests: ExtensionManifest[] = listManifests(),
  rolloutContext?: RolloutContext
): WithExtensionId<ExtensionPointContribution>[] {
  if (!resolveActivePointOwner(pointId, plan, manifests, rolloutContext)) {
    return []
  }
  const result: WithExtensionId<ExtensionPointContribution>[] = []
  const seen = new Set<string>()
  for (const manifest of manifests) {
    if (!isActive(manifest, plan, rolloutContext)) {
      continue
    }
    for (const contribution of manifest.contributes.points?.[pointId] ?? []) {
      if (seen.has(contribution.id)) {
        continue
      }
      seen.add(contribution.id)
      result.push({ ...contribution, extensionId: manifest.id })
    }
  }
  return result
}

function collect<T, K extends string>(
  active: ExtensionManifest[],
  pick: (manifest: ExtensionManifest) => T[] | undefined,
  key: (item: T) => K
): WithExtensionId<T>[] {
  const seen = new Set<string>()
  const result: WithExtensionId<T>[] = []
  for (const manifest of active) {
    for (const item of pick(manifest) ?? []) {
      const itemKey = key(item)
      if (seen.has(itemKey)) {
        continue // first registered wins; duplicates are ignored
      }
      seen.add(itemKey)
      result.push({ ...item, extensionId: manifest.id })
    }
  }
  return result
}

/**
 * Workbench host entrypoint: kernel-point contributions (activity / views /
 * editors / commands) from active extensions plus contributions to
 * extension-defined points whose owner is active.
 */
export function getActiveWorkbenchContributions(
  plan: Plan,
  manifests: ExtensionManifest[] = listManifests(),
  rolloutContext?: RolloutContext
): ActiveWorkbenchContributions {
  const active = manifests.filter((manifest) =>
    isActive(manifest, plan, rolloutContext)
  )

  const points: ActiveWorkbenchContributions["points"] = {}
  for (const pointId of getPointDefiners(manifests).keys()) {
    const contributions = getContributionsToPoint(
      pointId,
      plan,
      manifests,
      rolloutContext
    )
    if (contributions.length > 0) {
      points[pointId] = contributions
    }
  }

  const activity = collect(
    active,
    (manifest) => manifest.contributes.activity,
    (item) => item.id
  )
  const activityIds = new Set(activity.map((item) => item.id))

  return {
    activity,
    // Fail closed: a view whose activity is not contributed by an active
    // extension is dropped (views for kernel-owned activities are not
    // contributed through the host).
    views: collect(
      active,
      (manifest) => manifest.contributes.views,
      (item) => item.id
    ).filter((view) => activityIds.has(view.activityId)),
    editors: collect(
      active,
      (manifest) => manifest.contributes.editors,
      (item) => item.viewType
    ),
    commands: collect(
      active,
      (manifest) => manifest.contributes.commands,
      (item) => item.id
    ),
    points,
  }
}
