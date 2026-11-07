"use client"

import { ActivityBar } from "@/components/workbench/activity-bar"
import { BottomPanel } from "@/components/workbench/bottom-panel"
import { EditorGroup } from "@/components/workbench/editor-group"
import {
  PrimarySidebarMobile,
  PrimarySidebarPanel,
} from "@/components/workbench/primary-sidebar"
import {
  useWorkbench,
  WorkbenchProvider,
} from "@/components/workbench/workbench-context"
import type { WorkbenchContributions } from "@/lib/workbench/types"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@starboard/lib-ui/components/resizable"
import { useIsMobile } from "@starboard/lib-ui/hooks/use-mobile"

type WorkbenchUser = { name: string; email: string; image?: string | null }

/**
 * Sidebar + editor column. Desktop: resizable primary sidebar vs editor group.
 * Mobile: full-width editor; sidebar is the activity-bar sheet.
 */
function WorkbenchMain({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useWorkbench()
  const isMobile = useIsMobile()

  if (isMobile || !sidebarOpen) {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-1">
        <EditorGroup>{children}</EditorGroup>
      </div>
    )
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full min-h-0 min-w-0 flex-1"
      data-testid="sidebar-editor-split"
    >
      <ResizablePanel
        id="workbench-sidebar"
        defaultSize={240}
        minSize={160}
        maxSize="40%"
        className="h-full min-h-0"
      >
        <PrimarySidebarPanel />
      </ResizablePanel>
      <ResizableHandle
        withHandle
        data-testid="sidebar-editor-resize-handle"
      />
      <ResizablePanel
        id="workbench-editor"
        defaultSize="70%"
        minSize="40%"
        className="h-full min-h-0 min-w-0"
      >
        <EditorGroup>{children}</EditorGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

/**
 * Kernel workbench chrome: activity bar · primary sidebar · editor group · panel.
 * Regions render empty when `contributions` is empty (kernel-only lab).
 */
export function WorkbenchShell({
  user,
  contributions,
  showAdminNav = false,
  impersonationBanner = null,
  children,
}: {
  user: WorkbenchUser
  contributions: WorkbenchContributions
  showAdminNav?: boolean
  impersonationBanner?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <WorkbenchProvider contributions={contributions}>
      <div className="flex h-svh flex-col overflow-hidden" data-workbench>
        {impersonationBanner}
        <div className="flex min-h-0 flex-1">
          <ActivityBar user={user} showAdminNav={showAdminNav} />
          <PrimarySidebarMobile />
          <WorkbenchMain>{children}</WorkbenchMain>
        </div>
        <BottomPanel />
      </div>
    </WorkbenchProvider>
  )
}
