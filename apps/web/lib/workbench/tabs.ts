import { buildDeepLink, matchDeepLink } from "./deep-link"
import type { EditorTab, WorkbenchEditor } from "./types"

export type TabsState = {
  tabs: EditorTab[]
  activeTabId: string | null
  /** Last pathname reconciled into tab state (deep-link sync). */
  syncedPath: string | null
}

export type TabsAction =
  | { type: "open"; viewType: string; resourceId: string; title?: string }
  | { type: "focus"; id: string }
  | { type: "close"; id: string }
  | { type: "route"; pathname: string; editors: readonly WorkbenchEditor[] }

export function tabId(viewType: string, resourceId: string): string {
  return `${viewType}:${resourceId}`
}

function humanize(value: string): string {
  const spaced = value.replace(/[-_]+/g, " ").trim()
  return spaced ? spaced[0]!.toUpperCase() + spaced.slice(1) : value
}

export function defaultTabTitle(
  editor: WorkbenchEditor | undefined,
  viewType: string,
  resourceId: string
): string {
  const name = editor?.displayName ?? humanize(viewType)
  if (resourceId.startsWith("/")) {
    const last = resourceId.split("/").filter(Boolean).pop()
    return last ? humanize(last) : name
  }
  return `${name} ${resourceId.length > 8 ? resourceId.slice(0, 8) : resourceId}`
}

export function initialTabsState(): TabsState {
  return { tabs: [], activeTabId: null, syncedPath: null }
}

function openTab(
  state: TabsState,
  viewType: string,
  resourceId: string,
  title: string
): TabsState {
  const id = tabId(viewType, resourceId)
  if (state.tabs.some((tab) => tab.id === id)) {
    return { ...state, activeTabId: id }
  }
  return {
    ...state,
    tabs: [...state.tabs, { id, viewType, resourceId, title }],
    activeTabId: id,
  }
}

export function closeTab(state: TabsState, id: string): TabsState {
  const index = state.tabs.findIndex((tab) => tab.id === id)
  if (index === -1) return state
  const tabs = state.tabs.filter((tab) => tab.id !== id)
  if (state.activeTabId !== id) return { ...state, tabs }
  const neighbor = tabs[index] ?? tabs[index - 1] ?? null
  return { ...state, tabs, activeTabId: neighbor?.id ?? null }
}

export function tabsReducer(state: TabsState, action: TabsAction): TabsState {
  switch (action.type) {
    case "open": {
      const title =
        action.title ??
        defaultTabTitle(undefined, action.viewType, action.resourceId)
      return openTab(state, action.viewType, action.resourceId, title)
    }
    case "focus":
      return state.tabs.some((tab) => tab.id === action.id)
        ? { ...state, activeTabId: action.id }
        : state
    case "close":
      return closeTab(state, action.id)
    case "route": {
      const next = { ...state, syncedPath: action.pathname }
      const match = matchDeepLink(action.pathname, action.editors)
      if (!match) {
        // Workbench home (`/`) deselects; unmatched paths leave state alone.
        return action.pathname === "/" ? { ...next, activeTabId: null } : next
      }
      const editor = action.editors.find((e) => e.viewType === match.viewType)
      return openTab(
        next,
        match.viewType,
        match.resourceId,
        defaultTabTitle(editor, match.viewType, match.resourceId)
      )
    }
  }
}

/** Route for a tab, or null when the tab is a stub (no deep link). */
export function tabHref(
  tab: EditorTab,
  editors: readonly WorkbenchEditor[]
): string | null {
  const editor = editors.find((e) => e.viewType === tab.viewType)
  return buildDeepLink(editor, tab.resourceId)
}
