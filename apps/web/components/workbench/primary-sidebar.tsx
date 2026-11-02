"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useWorkbench } from "@/components/workbench/workbench-context"
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
  const { contributions, activeActivityId } = useWorkbench()

  const views = contributions.views.filter(
    (view) => view.activityId === activeActivityId
  )

  if (views.length === 0) {
    return (
      <p className="p-4 text-xs text-muted-foreground">No views contributed.</p>
    )
  }

  return views.map((view) => (
    <section key={view.id} className="py-2">
      <h2 className="px-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {view.name}
      </h2>
      <ul>
        {view.entries.map((entry) => (
          <li key={entry.id}>
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
          </li>
        ))}
      </ul>
    </section>
  ))
}

/** Inline sidebar on md+; overlay drawer on mobile (toggled via activity bar). */
export function PrimarySidebar() {
  const { sidebarOpen, mobileSidebarOpen, closeMobileSidebar } = useWorkbench()

  return (
    <>
      {sidebarOpen ? (
        <aside
          aria-label="Primary sidebar"
          data-region="primary-sidebar"
          className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r bg-sidebar md:flex"
        >
          <SidebarViews />
        </aside>
      ) : null}
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
    </>
  )
}
