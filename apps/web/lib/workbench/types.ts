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
   * Route-backed editor deep link. Pattern is `/segment/:resourceId`, a static
   * path (`/rates/upload`), or (rarely) `/*` as a last-resort fallback.
   * Editors without `deepLink` render the generic stub editor.
   */
  deepLink?: string
}

/** `workbench.newTab` — New Tab welcome quick action. */
export type WorkbenchNewTabAction = {
  id: string
  label: string
  order?: number
  /** Portable chord tokens (`mod`, `shift`, `alt`, letter). */
  keybinding?: string[]
  opens?: { viewType: string; resourceId: string; title?: string }
  /** Client handler id resolved by the shell (`builtinNewTabCommands`). */
  command?: string
  extensionId?: string
}

/** `workbench.statusBar` — footer launcher / toggle. */
export type WorkbenchStatusBarAction = {
  id: string
  label: string
  order?: number
  opens?: { viewType: string; resourceId: string; title?: string }
  command?: string
  extensionId?: string
}

/** Serializable contribution into an extension-defined point. */
export type WorkbenchPointContribution = {
  id: string
  label?: string
  component?: string
  order?: number
  props?: Record<string, string | number | boolean>
  extensionId?: string
}

export type WorkbenchContributions = {
  activity: WorkbenchActivity[]
  views: WorkbenchView[]
  editors: WorkbenchEditor[]
  newTab: WorkbenchNewTabAction[]
  statusBar: WorkbenchStatusBarAction[]
  /** Contributions to extension-defined points, keyed by point id. */
  points: Record<string, WorkbenchPointContribution[]>
}

export const EMPTY_CONTRIBUTIONS: WorkbenchContributions = {
  activity: [],
  views: [],
  editors: [],
  newTab: [],
  statusBar: [],
  points: {},
}

/** Side-by-side editor columns (Cursor / VS Code–style horizontal split). */
export type EditorGroupId = "primary" | "secondary"

export type EditorTab = {
  /** `${viewType}:${resourceId}` */
  id: string
  viewType: string
  resourceId: string
  title: string
  /** Which split pane owns this tab. */
  groupId: EditorGroupId
}
