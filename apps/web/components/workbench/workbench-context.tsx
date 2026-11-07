"use client"

import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

import { useIsMobile } from "@starboard/lib-ui/hooks/use-mobile"

import {
  closeTab,
  hasSecondaryGroup,
  initialTabsState,
  tabHref,
  tabsInGroup,
  tabsReducer,
  type TabsState,
} from "@/lib/workbench/tabs"
import type {
  EditorGroupId,
  EditorTab,
  WorkbenchContributions,
} from "@/lib/workbench/types"

export type OpenEditorInput = {
  viewType: string
  resourceId: string
  title?: string
  /** Open / move into the right split pane (creates the split if needed). */
  side?: "beside"
}

type WorkbenchContextValue = {
  contributions: WorkbenchContributions
  tabs: EditorTab[]
  activeTabId: string | null
  activeByGroup: Record<EditorGroupId, string | null>
  focusedGroup: EditorGroupId
  splitOpen: boolean
  activeActivityId: string | null
  /** Desktop: inline sidebar visible. */
  sidebarOpen: boolean
  /** Mobile (<md): sidebar shown as an overlay drawer. */
  mobileSidebarOpen: boolean
  panelOpen: boolean
  /** Open (or focus) an editor tab; route-backed editors also navigate. */
  openEditor: (input: OpenEditorInput) => void
  /** Update an open tab's title (e.g. short quote id after load). */
  renameTab: (id: string, title: string) => void
  focusTab: (id: string) => void
  focusGroup: (group: EditorGroupId) => void
  /**
   * Deselect the active tab in a pane (tabs stay open) and show New Tab.
   * Clicking a tab again restores that editor.
   */
  showNewTab: (group: EditorGroupId) => void
  closeEditorTab: (id: string) => void
  /** Move a tab into the other pane (opens secondary when moving right). */
  moveEditorTab: (id: string, group: EditorGroupId) => void
  /** Move the focused tab into the right pane. */
  splitEditorRight: () => void
  tabsForGroup: (group: EditorGroupId) => EditorTab[]
  selectActivity: (id: string) => void
  closeMobileSidebar: () => void
  togglePanel: () => void
}

const WorkbenchContext = React.createContext<WorkbenchContextValue | null>(null)

export function useWorkbench(): WorkbenchContextValue {
  const value = React.useContext(WorkbenchContext)
  if (!value)
    throw new Error("useWorkbench must be used inside WorkbenchProvider")
  return value
}

export function WorkbenchProvider({
  contributions,
  children,
}: {
  contributions: WorkbenchContributions
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { editors } = contributions

  const [state, dispatch] = React.useReducer(
    tabsReducer,
    undefined,
    (): TabsState =>
      tabsReducer(initialTabsState(), { type: "route", pathname, editors })
  )

  // Deep-link sync: reconcile URL → tab state during render (SSR-safe, no effect).
  if (state.syncedPath !== pathname) {
    dispatch({ type: "route", pathname, editors })
  }

  const [activityOverride, setActivityOverride] = React.useState<string | null>(
    null
  )
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [mobileOverride, setMobileSidebarOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const mobileSidebarOpen = isMobile && mobileOverride
  const [panelOpen, setPanelOpen] = React.useState(false)

  const activeActivityId =
    contributions.activity.find((a) => a.id === activityOverride)?.id ??
    contributions.activity[0]?.id ??
    null

  const value = React.useMemo<WorkbenchContextValue>(() => {
    const navigate = (tab: EditorTab) => {
      const href = tabHref(tab, editors)
      if (href && href !== pathname) router.push(href)
    }

    return {
      contributions,
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      activeByGroup: state.activeByGroup,
      focusedGroup: state.focusedGroup,
      splitOpen: hasSecondaryGroup(state),
      activeActivityId,
      sidebarOpen,
      mobileSidebarOpen,
      panelOpen,
      openEditor: ({ viewType, resourceId, title, side }) => {
        dispatch({
          type: "open",
          viewType,
          resourceId,
          title,
          ...(side === "beside" ? { group: "beside" as const } : {}),
        })
        navigate({
          id: "",
          viewType,
          resourceId,
          title: title ?? "",
          groupId: side === "beside" ? "secondary" : state.focusedGroup,
        })
      },
      renameTab: (id, title) => {
        dispatch({ type: "rename", id, title })
      },
      focusTab: (id) => {
        const tab = state.tabs.find((t) => t.id === id)
        if (!tab) return
        dispatch({ type: "focus", id })
        navigate(tab)
      },
      focusGroup: (group) => {
        dispatch({ type: "focusGroup", group })
      },
      showNewTab: (group) => {
        dispatch({ type: "showNewTab", group })
        // Primary New Tab owns `/`; secondary New Tab keeps the current URL so
        // the other pane's deep link is not wiped by route sync.
        if (group === "primary" && pathname !== "/") router.push("/")
      },
      closeEditorTab: (id) => {
        const wasFocusedActive = state.activeTabId === id
        const next = closeTab(state, id)
        dispatch({ type: "close", id })
        if (!wasFocusedActive) return
        const neighbor = next.tabs.find((t) => t.id === next.activeTabId)
        if (neighbor) navigate(neighbor)
        else if (pathname !== "/") router.push("/")
      },
      moveEditorTab: (id, group) => {
        dispatch({ type: "move", id, group })
        const tab = state.tabs.find((t) => t.id === id)
        if (tab) navigate({ ...tab, groupId: group })
      },
      splitEditorRight: () => {
        dispatch({ type: "splitRight" })
      },
      tabsForGroup: (group) => tabsInGroup(state.tabs, group),
      selectActivity: (id) => {
        if (isMobile) {
          setActivityOverride(id)
          setMobileSidebarOpen(
            id === activeActivityId ? !mobileSidebarOpen : true
          )
        } else if (id === activeActivityId) {
          setSidebarOpen((open) => !open)
        } else {
          setActivityOverride(id)
          setSidebarOpen(true)
        }
      },
      closeMobileSidebar: () => setMobileSidebarOpen(false),
      togglePanel: () => setPanelOpen((open) => !open),
    }
  }, [
    activeActivityId,
    contributions,
    editors,
    isMobile,
    mobileSidebarOpen,
    panelOpen,
    pathname,
    router,
    sidebarOpen,
    state,
  ])

  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  )
}
