"use client"

import * as React from "react"
import Link from "next/link"
import {
  BuildingsIcon,
  FileTextIcon,
  GearIcon,
  LifebuoyIcon,
  PaperPlaneTiltIcon,
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
} from "@workspace/ui/components/sidebar"

const navSecondary = [
  {
    title: "Support",
    url: "#",
    icon: <LifebuoyIcon />,
  },
  {
    title: "Feedback",
    url: "#",
    icon: <PaperPlaneTiltIcon />,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: <GearIcon />,
  },
]

export function AppSidebar({
  user,
  extensionNav = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    image?: string | null
  }
  extensionNav?: Array<{
    id: string
    label: string
    href: string
  }>
}) {
  const navMain = [
    {
      title: "Quotes",
      url: "/",
      icon: <FileTextIcon />,
    },
    ...extensionNav.map((item) => ({
      title: item.label,
      url: item.href,
      icon: null,
    })),
  ]

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
                <BuildingsIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Starboard</span>
                <span className="truncate text-xs">Workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
