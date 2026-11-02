/**
 * Kernel workbench contribution + tab types (ticket 074).
 *
 * Everything here is serializable (server layout → client shell). The kernel
 * only knows generic hosts: activity bar, sidebar views, editor viewTypes.
 */

export type WorkbenchActivity = {
  id: string
  label: string
  /** Icon key resolved by the client shell; unknown keys fall back to a default. */
  icon?: string
}

export type WorkbenchViewEntry = {
  id: string
  label: string
  /** Navigates; if the href matches an editor deep link, a tab opens. */
  href?: string
  /** Opens an extension-provided (non-route) editor tab directly. */
  opens?: { viewType: string; resourceId: string; title?: string }
}

export type WorkbenchView = {
  id: string
  name: string
  activityId: string
  entries: WorkbenchViewEntry[]
}

export type WorkbenchEditor = {
  viewType: string
  displayName: string
  /**
   * Route-backed editor (compatibility shim). Pattern is either
   * `/segment/:resourceId` or `/*` (resource id = full pathname).
   * Editors without `deepLink` render the generic stub editor.
   */
  deepLink?: string
}

export type WorkbenchContributions = {
  activity: WorkbenchActivity[]
  views: WorkbenchView[]
  editors: WorkbenchEditor[]
}

export const EMPTY_CONTRIBUTIONS: WorkbenchContributions = {
  activity: [],
  views: [],
  editors: [],
}

export type EditorTab = {
  /** `${viewType}:${resourceId}` */
  id: string
  viewType: string
  resourceId: string
  title: string
}
