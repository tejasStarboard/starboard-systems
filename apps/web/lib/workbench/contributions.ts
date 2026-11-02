import { deepLinksCollide } from "./deep-link"
import {
  EMPTY_CONTRIBUTIONS,
  type WorkbenchActivity,
  type WorkbenchContributions,
  type WorkbenchEditor,
  type WorkbenchPointContribution,
  type WorkbenchView,
} from "./types"

/**
 * Structural subset of `ActiveWorkbenchContributions` from `@starboard/ext-host`
 * (kept local so this module stays free of server-only imports).
 */
export type HostWorkbenchContributions = {
  activity: ReadonlyArray<WorkbenchActivity>
  views: ReadonlyArray<
    Omit<WorkbenchView, "entries"> & {
      entries?: WorkbenchView["entries"]
    }
  >
  editors: ReadonlyArray<WorkbenchEditor>
  points?: Readonly<Record<string, ReadonlyArray<WorkbenchPointContribution>>>
}

function pick<T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (value[key] !== undefined) result[key] = value[key]
  }
  return result
}

/**
 * Append extension-host contributions to a base set. Base wins on duplicate
 * ids/viewTypes and on colliding editor `deepLink` patterns (so a stray
 * extension cannot shadow or steal routes already claimed); views pointing at an
 * unknown activity are dropped (fail closed).
 */
export function mergeHostContributions(
  base: WorkbenchContributions,
  host: HostWorkbenchContributions | undefined
): WorkbenchContributions {
  if (!host) return base

  // Host activities lead the bar (driving built-ins such as Quotes come first).
  // Base wins on duplicate ids.
  const activityIds = new Set(base.activity.map((item) => item.id))
  const hostActivity: WorkbenchActivity[] = []
  for (const item of host.activity) {
    if (activityIds.has(item.id)) continue
    activityIds.add(item.id)
    hostActivity.push(pick(item, ["id", "label", "icon"]) as WorkbenchActivity)
  }
  const activity = [...hostActivity, ...base.activity]

  const viewIds = new Set(base.views.map((item) => item.id))
  const views = [...base.views]
  for (const item of host.views) {
    if (viewIds.has(item.id) || !activityIds.has(item.activityId)) continue
    viewIds.add(item.id)
    views.push({
      id: item.id,
      name: item.name,
      activityId: item.activityId,
      entries: (item.entries ?? []).map((entry) => ({
        id: entry.id,
        label: entry.label,
        ...(entry.href ? { href: entry.href } : {}),
        ...(entry.opens ? { opens: entry.opens } : {}),
      })),
    })
  }

  const viewTypes = new Set(base.editors.map((item) => item.viewType))
  const editors = [...base.editors]
  for (const item of host.editors) {
    if (viewTypes.has(item.viewType)) continue
    // Existing deepLink patterns win: a host editor may not claim routes
    // already claimed (fail closed — the editor is dropped).
    if (
      item.deepLink &&
      editors.some(
        (existing) =>
          existing.deepLink &&
          deepLinksCollide(existing.deepLink, item.deepLink!)
      )
    ) {
      continue
    }
    viewTypes.add(item.viewType)
    editors.push(
      pick(item, ["viewType", "displayName", "deepLink"]) as WorkbenchEditor
    )
  }

  const points: Record<string, WorkbenchPointContribution[]> = {
    ...base.points,
  }
  for (const [pointId, contributions] of Object.entries(host.points ?? {})) {
    const existing = points[pointId] ?? []
    const seen = new Set(existing.map((item) => item.id))
    const merged = [...existing]
    for (const item of contributions) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      merged.push({
        id: item.id,
        ...(item.label ? { label: item.label } : {}),
        ...(item.component ? { component: item.component } : {}),
        ...(item.order !== undefined ? { order: item.order } : {}),
        ...(item.props ? { props: item.props } : {}),
        ...(item.extensionId ? { extensionId: item.extensionId } : {}),
      })
    }
    points[pointId] = merged
  }

  return { activity, views, editors, points }
}

/**
 * Resolve shell workbench contributions from the extension host.
 * Kernel-only lab → empty. Otherwise host contributions alone (no legacy shim).
 */
export function resolveWorkbenchContributions(options: {
  kernelOnly: boolean
  hostContributions?: HostWorkbenchContributions
}): WorkbenchContributions {
  if (options.kernelOnly) return EMPTY_CONTRIBUTIONS
  return mergeHostContributions(EMPTY_CONTRIBUTIONS, options.hostContributions)
}

/** `WORKBENCH_KERNEL_ONLY` = `1` | `true` → empty workbench lab. */
export function isKernelOnlyFlag(value: string | undefined): boolean {
  return value === "1" || value === "true"
}
