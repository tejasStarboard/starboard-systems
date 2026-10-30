"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

type AppShellUser = {
  name: string
  email: string
  image?: string | null
}

export type ExtensionNavItem = {
  id: string
  label: string
  href: string
}

export function AppShell({
  user,
  extensionNav = [],
  children,
}: {
  user: AppShellUser
  extensionNav?: ExtensionNavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar user={user} extensionNav={extensionNav} />
          <SidebarInset>
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
