"use client"

import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

import {
  closeTab,
  initialTabsState,
  tabHref,
  tabsReducer,
  type TabsState,
} from "@/lib/workbench/tabs"
import type { EditorTab, WorkbenchContributions } from "@/lib/workbench/types"

type WorkbenchContextValue = {
  contributions: WorkbenchContributions
  tabs: EditorTab[]
  activeTabId: string | null
  activeActivityId: string | null
  sidebarOpen: boolean
  panelOpen: boolean
  /** Open (or focus) an editor tab; route-backed editors also navigate. */
  openEditor: (input: {
    viewType: string
    resourceId: string
    title?: string
  }) => void
  focusTab: (id: string) => void
  closeEditorTab: (id: string) => void
  selectActivity: (id: string) => void
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
      activeActivityId,
      sidebarOpen,
      panelOpen,
      openEditor: ({ viewType, resourceId, title }) => {
        dispatch({ type: "open", viewType, resourceId, title })
        navigate({ id: "", viewType, resourceId, title: title ?? "" })
      },
      focusTab: (id) => {
        const tab = state.tabs.find((t) => t.id === id)
        if (!tab) return
        dispatch({ type: "focus", id })
        navigate(tab)
      },
      closeEditorTab: (id) => {
        const next = closeTab(state, id)
        dispatch({ type: "close", id })
        if (state.activeTabId !== id) return
        const neighbor = next.tabs.find((t) => t.id === next.activeTabId)
        if (neighbor) navigate(neighbor)
        else if (pathname !== "/") router.push("/")
      },
      selectActivity: (id) => {
        if (id === activeActivityId) {
          setSidebarOpen((open) => !open)
        } else {
          setActivityOverride(id)
          setSidebarOpen(true)
        }
      },
      togglePanel: () => setPanelOpen((open) => !open),
    }
  }, [
    activeActivityId,
    contributions,
    editors,
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
