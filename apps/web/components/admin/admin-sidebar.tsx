"use client"

import Link from "next/link"
import {
  ArrowLeftIcon,
  BuildingsIcon,
  GearIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@starboard/lib-ui/components/sidebar"

const navMain = [
  {
    title: "Overview",
    url: "/admin",
    icon: <ShieldCheckIcon />,
  },
  {
    title: "Extensions",
    url: "/admin/extensions",
    icon: <PuzzlePieceIcon />,
  },
  {
    title: "Organizations",
    url: "/admin/organizations",
    icon: <UsersThreeIcon />,
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "/admin/settings",
    icon: <GearIcon />,
  },
  {
    title: "Back to app",
    url: "/",
    icon: <ArrowLeftIcon />,
  },
]

export function AdminSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    image?: string | null
  }
}) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
              <div className="flex aspect-square size-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
                <BuildingsIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Starboard</span>
                <span className="truncate text-xs">Platform admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} label="Admin" />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
