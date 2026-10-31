"use client"

import { SidebarIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@starboard/lib-ui/components/breadcrumb"
import { Button } from "@starboard/lib-ui/components/button"
import { Separator } from "@starboard/lib-ui/components/separator"
import { useSidebar } from "@starboard/lib-ui/components/sidebar"

function breadcrumbLabel(pathname: string) {
  if (pathname === "/admin") return "Overview"
  if (pathname.startsWith("/admin/extensions")) return "Extensions"
  if (pathname.startsWith("/admin/organizations")) return "Organizations"
  if (pathname.startsWith("/admin/settings")) return "Settings"
  return "Admin"
}

export function AdminSiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const current = breadcrumbLabel(pathname)

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{current}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
