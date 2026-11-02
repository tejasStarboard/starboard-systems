"use client"

import { ActivityBar } from "@/components/workbench/activity-bar"
import { BottomPanel } from "@/components/workbench/bottom-panel"
import { EditorGroup } from "@/components/workbench/editor-group"
import { PrimarySidebar } from "@/components/workbench/primary-sidebar"
import { WorkbenchProvider } from "@/components/workbench/workbench-context"
import type { WorkbenchContributions } from "@/lib/workbench/types"

type WorkbenchUser = { name: string; email: string; image?: string | null }

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
          <PrimarySidebar />
          <EditorGroup>{children}</EditorGroup>
        </div>
        <BottomPanel />
      </div>
    </WorkbenchProvider>
  )
}
