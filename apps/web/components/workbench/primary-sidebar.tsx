"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useWorkbench } from "@/components/workbench/workbench-context"
import { cn } from "@starboard/lib-ui/lib/utils"

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href
}

export function PrimarySidebar() {
  const pathname = usePathname()
  const { contributions, activeActivityId, sidebarOpen } = useWorkbench()

  if (!sidebarOpen) return null

  const views = contributions.views.filter(
    (view) => view.activityId === activeActivityId
  )

  return (
    <aside
      aria-label="Primary sidebar"
      data-region="primary-sidebar"
      className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r bg-sidebar md:flex"
    >
      {views.length === 0 ? (
        <p className="p-4 text-xs text-muted-foreground">
          No views contributed.
        </p>
      ) : (
        views.map((view) => (
          <section key={view.id} className="py-2">
            <h2 className="px-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {view.name}
            </h2>
            <ul>
              {view.entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
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
      )}
    </aside>
  )
}
