"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminSiteHeader } from "@/components/admin/admin-site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@starboard/lib-ui/components/sidebar"

type AdminShellUser = {
  name: string
  email: string
  image?: string | null
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser
  children: React.ReactNode
}) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <AdminSiteHeader />
        <div className="flex flex-1">
          <AdminSidebar user={user} />
          <SidebarInset>
            <div className="flex flex-1 flex-col p-4 sm:p-6">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
