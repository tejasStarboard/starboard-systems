import { buildDeepLink, matchDeepLink } from "./deep-link"
import type { EditorGroupId, EditorTab, WorkbenchEditor } from "./types"

export type TabsState = {
  tabs: EditorTab[]
  /** Active tab id within each editor group. */
  activeByGroup: Record<EditorGroupId, string | null>
  /** Group whose active tab receives keyboard focus + URL sync. */
  focusedGroup: EditorGroupId
  /**
   * Focused group's active tab. Mirrored for callers/tests; always equals
   * `activeByGroup[focusedGroup]`.
   */
  activeTabId: string | null
  /** Last pathname reconciled into tab state (deep-link sync). */
  syncedPath: string | null
}

export type TabsAction =
  | {
      type: "open"
      viewType: string
      resourceId: string
      title?: string
      /** Target group; `beside` = secondary (create split). */
      group?: EditorGroupId | "beside"
    }
  | { type: "focus"; id: string }
  | { type: "focusGroup"; group: EditorGroupId }
  /** Clear the group's active tab (tabs stay open); shows New Tab in that pane. */
  | { type: "showNewTab"; group: EditorGroupId }
  | { type: "close"; id: string }
  | { type: "rename"; id: string; title: string }
  | { type: "move"; id: string; group: EditorGroupId }
  /** Move focused-group active tab into the other group (creates secondary). */
  | { type: "splitRight" }
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

function syncActive(state: Omit<TabsState, "activeTabId">): TabsState {
  return {
    ...state,
    activeTabId: state.activeByGroup[state.focusedGroup],
  }
}

export function initialTabsState(): TabsState {
  return syncActive({
    tabs: [],
    activeByGroup: { primary: null, secondary: null },
    focusedGroup: "primary",
    syncedPath: null,
  })
}

export function tabsInGroup(
  tabs: readonly EditorTab[],
  group: EditorGroupId
): EditorTab[] {
  return tabs.filter((tab) => tab.groupId === group)
}

export function hasSecondaryGroup(state: TabsState): boolean {
  return tabsInGroup(state.tabs, "secondary").length > 0
}

function resolveOpenGroup(
  state: TabsState,
  group: EditorGroupId | "beside" | undefined
): EditorGroupId {
  if (group === "beside") return "secondary"
  if (group === "primary" || group === "secondary") return group
  return state.focusedGroup
}

function openTab(
  state: TabsState,
  viewType: string,
  resourceId: string,
  title: string,
  group: EditorGroupId | "beside" | undefined
): TabsState {
  const id = tabId(viewType, resourceId)
  const existing = state.tabs.find((tab) => tab.id === id)
  if (existing) {
    const target =
      group === "beside" || group === "secondary" || group === "primary"
        ? resolveOpenGroup(state, group)
        : existing.groupId
    const tabs =
      existing.groupId === target
        ? state.tabs
        : state.tabs.map((tab) =>
            tab.id === id ? { ...tab, groupId: target } : tab
          )
    const prevGroup = existing.groupId
    let activeByGroup = {
      ...state.activeByGroup,
      [target]: id,
    }
    if (prevGroup !== target) {
      const prevTabs = tabsInGroup(tabs, prevGroup)
      activeByGroup = {
        ...activeByGroup,
        [prevGroup]:
          state.activeByGroup[prevGroup] === id
            ? (prevTabs[prevTabs.length - 1]?.id ?? null)
            : state.activeByGroup[prevGroup],
      }
    }
    return syncActive({
      ...state,
      tabs,
      activeByGroup,
      focusedGroup: target,
    })
  }

  const target = resolveOpenGroup(state, group)
  const tab: EditorTab = { id, viewType, resourceId, title, groupId: target }
  return syncActive({
    ...state,
    tabs: [...state.tabs, tab],
    activeByGroup: { ...state.activeByGroup, [target]: id },
    focusedGroup: target,
  })
}

export function closeTab(state: TabsState, id: string): TabsState {
  const index = state.tabs.findIndex((tab) => tab.id === id)
  if (index === -1) return state
  const closing = state.tabs[index]!
  const tabs = state.tabs.filter((tab) => tab.id !== id)
  const groupTabs = tabsInGroup(tabs, closing.groupId)
  const neighbor =
    groupTabs.find((tab) => state.tabs.indexOf(tab) >= index) ??
    groupTabs[groupTabs.length - 1] ??
    null

  let activeByGroup: TabsState["activeByGroup"] = {
    ...state.activeByGroup,
    [closing.groupId]:
      state.activeByGroup[closing.groupId] === id
        ? (neighbor?.id ?? null)
        : state.activeByGroup[closing.groupId],
  }

  let focusedGroup = state.focusedGroup
  // Collapse empty secondary; keep focus on a group that still has tabs.
  if (
    closing.groupId === "secondary" &&
    tabsInGroup(tabs, "secondary").length === 0
  ) {
    activeByGroup = { ...activeByGroup, secondary: null }
    if (focusedGroup === "secondary") focusedGroup = "primary"
  }

  if (
    focusedGroup === closing.groupId &&
    activeByGroup[focusedGroup] === null &&
    closing.groupId === "primary" &&
    tabsInGroup(tabs, "secondary").length > 0
  ) {
    focusedGroup = "secondary"
  }

  return syncActive({ ...state, tabs, activeByGroup, focusedGroup })
}

function moveTab(
  state: TabsState,
  id: string,
  group: EditorGroupId
): TabsState {
  const tab = state.tabs.find((t) => t.id === id)
  if (!tab || tab.groupId === group) {
    return syncActive({
      ...state,
      activeByGroup: { ...state.activeByGroup, [group]: id },
      focusedGroup: group,
    })
  }

  const tabs = state.tabs.map((t) =>
    t.id === id ? { ...t, groupId: group } : t
  )
  const from = tab.groupId
  const fromTabs = tabsInGroup(tabs, from)
  const activeByGroup: TabsState["activeByGroup"] = {
    ...state.activeByGroup,
    [group]: id,
    [from]:
      state.activeByGroup[from] === id
        ? (fromTabs[fromTabs.length - 1]?.id ?? null)
        : state.activeByGroup[from],
  }

  let focusedGroup: EditorGroupId = group
  if (from === "secondary" && fromTabs.length === 0) {
    activeByGroup.secondary = null
  }

  return syncActive({ ...state, tabs, activeByGroup, focusedGroup })
}

export function tabsReducer(state: TabsState, action: TabsAction): TabsState {
  switch (action.type) {
    case "open": {
      const title =
        action.title ??
        defaultTabTitle(undefined, action.viewType, action.resourceId)
      return openTab(
        state,
        action.viewType,
        action.resourceId,
        title,
        action.group
      )
    }
    case "focus": {
      const tab = state.tabs.find((t) => t.id === action.id)
      if (!tab) return state
      return syncActive({
        ...state,
        activeByGroup: {
          ...state.activeByGroup,
          [tab.groupId]: tab.id,
        },
        focusedGroup: tab.groupId,
      })
    }
    case "focusGroup":
      return syncActive({ ...state, focusedGroup: action.group })
    case "showNewTab":
      return syncActive({
        ...state,
        activeByGroup: {
          ...state.activeByGroup,
          [action.group]: null,
        },
        focusedGroup: action.group,
      })
    case "close":
      return closeTab(state, action.id)
    case "rename": {
      const title = action.title.trim()
      if (!title) return state
      let changed = false
      const tabs = state.tabs.map((tab) => {
        if (tab.id !== action.id || tab.title === title) return tab
        changed = true
        return { ...tab, title }
      })
      return changed ? { ...state, tabs } : state
    }
    case "move":
      return moveTab(state, action.id, action.group)
    case "splitRight": {
      const activeId = state.activeByGroup[state.focusedGroup]
      if (!activeId) return state
      return moveTab(state, activeId, "secondary")
    }
    case "route": {
      const next = { ...state, syncedPath: action.pathname }
      const match = matchDeepLink(action.pathname, action.editors)
      if (!match) {
        // Workbench home (`/`) shows New Tab in the primary pane; secondary
        // (e.g. Preview) keeps its active tab when the split is open.
        if (action.pathname === "/") {
          return syncActive({
            ...next,
            activeByGroup: {
              ...state.activeByGroup,
              primary: null,
            },
            focusedGroup: "primary",
          })
        }
        return next
      }
      const editor = action.editors.find((e) => e.viewType === match.viewType)
      return openTab(
        { ...next, activeTabId: state.activeTabId },
        match.viewType,
        match.resourceId,
        defaultTabTitle(editor, match.viewType, match.resourceId),
        state.focusedGroup
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
