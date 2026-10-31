"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@starboard/lib-ui/components/sidebar"

function isItemActive(pathname: string, url: string) {
  if (url === "/" || url === "/admin") {
    return pathname === url
  }

  return pathname === url || pathname.startsWith(`${url}/`)
}

export function NavMain({
  items,
  label = "Platform",
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
  label?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isItemActive(pathname, item.url)}
              render={<Link href={item.url} />}
            >
              {item.icon ? item.icon : null}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
