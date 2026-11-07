"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { useWorkbench } from "@/components/workbench/workbench-context"
import {
  builtinPointComponents,
  builtinViews,
} from "@/lib/workbench/builtin-editors"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@starboard/lib-ui/components/sheet"
import { cn } from "@starboard/lib-ui/lib/utils"

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href
}

function SidebarViews({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { contributions, activeActivityId, openEditor, tabs, activeTabId } =
    useWorkbench()

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const host = React.useMemo(
    () => ({
      openEditor: (input: Parameters<typeof openEditor>[0]) => {
        openEditor(input)
        onNavigate?.()
      },
      activeEditor: activeTab
        ? { viewType: activeTab.viewType, resourceId: activeTab.resourceId }
        : null,
      pointComponents: builtinPointComponents,
      slots: contributions.points,
    }),
    [openEditor, onNavigate, activeTab, contributions.points]
  )
  const views = contributions.views.filter(
    (view) => view.activityId === activeActivityId
  )

  if (views.length === 0) {
    return (
      <p className="p-4 text-xs text-muted-foreground">No views contributed.</p>
    )
  }

  return views.map((view) => {
    const Provided = builtinViews[view.id]
    return (
      <section key={view.id} className="py-2">
        <h2 className="px-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {view.name}
        </h2>
        <ul>
          {view.entries.map((entry) => (
            <li key={entry.id}>
              {entry.opens ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    openEditor(entry.opens!)
                    onNavigate?.()
                  }}
                  className={cn(
                    "h-auto w-full justify-start rounded-none px-4 py-1.5 text-left text-sm font-normal",
                    activeTab?.viewType === entry.opens.viewType &&
                      activeTab.resourceId === entry.opens.resourceId &&
                      "bg-muted font-medium"
                  )}
                >
                  {entry.label}
                </Button>
              ) : entry.href ? (
                <Link
                  href={entry.href}
                  onClick={onNavigate}
                  className={cn(
                    "block px-4 py-1.5 text-sm hover:bg-muted",
                    isActive(pathname, entry.href) && "bg-muted font-medium"
                  )}
                >
                  {entry.label}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
        {Provided ? <Provided host={host} /> : null}
      </section>
    )
  })
}

/**
 * Desktop primary sidebar body. Width comes from the parent resizable panel
 * (shell); fills the panel height.
 */
export function PrimarySidebarPanel() {
  return (
    <aside
      aria-label="Primary sidebar"
      data-region="primary-sidebar"
      className="flex h-full min-h-0 w-full flex-col overflow-y-auto border-r bg-sidebar"
    >
      <SidebarViews />
    </aside>
  )
}

/** Mobile overlay drawer (toggled via activity bar). */
export function PrimarySidebarMobile() {
  const { mobileSidebarOpen, closeMobileSidebar } = useWorkbench()

  return (
    <Sheet
      open={mobileSidebarOpen}
      onOpenChange={(open) => {
        if (!open) closeMobileSidebar()
      }}
    >
      <SheetContent
        side="left"
        showCloseButton={false}
        data-region="primary-sidebar-mobile"
        className="w-60 max-w-[80vw] overflow-y-auto bg-sidebar p-0 md:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sidebar</SheetTitle>
          <SheetDescription>
            Workbench primary sidebar views.
          </SheetDescription>
        </SheetHeader>
        <SidebarViews onNavigate={closeMobileSidebar} />
      </SheetContent>
    </Sheet>
  )
}
