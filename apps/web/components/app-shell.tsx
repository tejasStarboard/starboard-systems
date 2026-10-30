"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

type AppShellUser = {
  name: string
  email: string
  image?: string | null
}

export function AppShell({
  user,
  children,
}: {
  user: AppShellUser
  children: React.ReactNode
}) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar user={user} />
          <SidebarInset>
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
