import { deepLinksCollide } from "./deep-link"
import {
  EMPTY_CONTRIBUTIONS,
  type WorkbenchActivity,
  type WorkbenchContributions,
  type WorkbenchEditor,
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
 * extension cannot shadow or steal kernel/legacy routes); views pointing at an
 * unknown activity are dropped (fail closed).
 */
export function mergeHostContributions(
  base: WorkbenchContributions,
  host: HostWorkbenchContributions | undefined
): WorkbenchContributions {
  if (!host) return base

  // Host activities lead the bar (driving built-ins such as Quotes come first);
  // legacy shim activities follow until 078 moves them. Base wins on duplicate ids.
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
    // Legacy deepLink patterns win: a host editor may not claim routes already
    // claimed by an existing editor (fail closed — the editor is dropped).
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

  return { activity, views, editors }
}

/**
 * TEMPORARY compatibility shim (074).
 *
 * Today's customers / settings / extension pages are still owned by `apps/web`
 * route trees. This describes them as workbench contributions so the kernel
 * shell can host them. Quote moved into `quoting.document` in 077 (its own
 * activity, sidebar view and `quote` editor); 078 does CRM + settings.
 * 075: extension-host contributions (`getActiveWorkbenchContributions`) are merged
 * with `mergeHostContributions`. Delete the legacy part once built-ins
 * contribute through the extension host.
 */
export function legacyShellContributions(
  extensionNav: ReadonlyArray<{ id: string; label: string; href: string }> = []
): WorkbenchContributions {
  const settingsPages = [
    ["company", "Company"],
    ["team", "Team"],
    ["profile", "Profile"],
    ["preferences", "Preferences"],
    ["integrations", "Integrations"],
    ["quote-rules", "Quote rules"],
    ["billing", "Billing"],
  ] as const

  return {
    activity: [
      { id: "customers", label: "Customers", icon: "address-book" },
      { id: "settings", label: "Settings", icon: "gear" },
      ...(extensionNav.length > 0
        ? [{ id: "extensions", label: "Extensions", icon: "puzzle" }]
        : []),
    ],
    views: [
      {
        id: "customers.list",
        name: "Customers",
        activityId: "customers",
        entries: [
          { id: "customers.all", label: "All customers", href: "/customers" },
        ],
      },
      {
        id: "settings.pages",
        name: "Settings",
        activityId: "settings",
        entries: settingsPages.map(([slug, label]) => ({
          id: `settings.${slug}`,
          label,
          href: `/settings/${slug}`,
        })),
      },
      ...(extensionNav.length > 0
        ? [
            {
              id: "extensions.nav",
              name: "Extensions",
              activityId: "extensions",
              entries: extensionNav.map((item) => ({
                id: item.id,
                label: item.label,
                href: item.href,
              })),
            },
          ]
        : []),
    ],
    editors: [
      {
        viewType: "customer",
        displayName: "Customer",
        deepLink: "/customers/:resourceId",
      },
      // Catch-all for remaining legacy pages (settings, rates upload, inbox, …).
      { viewType: "page", displayName: "Page", deepLink: "/*" },
    ],
  }
}

export function resolveWorkbenchContributions(options: {
  kernelOnly: boolean
  extensionNav?: ReadonlyArray<{ id: string; label: string; href: string }>
  /** Active extension-host workbench contributions (075); merged after the legacy shim. */
  hostContributions?: HostWorkbenchContributions
}): WorkbenchContributions {
  if (options.kernelOnly) return EMPTY_CONTRIBUTIONS
  return mergeHostContributions(
    legacyShellContributions(options.extensionNav),
    options.hostContributions
  )
}

/** `WORKBENCH_KERNEL_ONLY` = `1` | `true` → empty workbench lab. */
export function isKernelOnlyFlag(value: string | undefined): boolean {
  return value === "1" || value === "true"
}
