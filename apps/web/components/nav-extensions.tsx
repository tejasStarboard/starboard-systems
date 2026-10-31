"use client"

import { PuzzlePieceIcon } from "@phosphor-icons/react"
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
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function NavExtensions({
  items,
}: {
  items: {
    id: string
    label: string
    href: string
  }[]
}) {
  const pathname = usePathname()

  if (items.length === 0) {
    return null
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Extensions</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              tooltip={item.label}
              isActive={isItemActive(pathname, item.href)}
              render={<Link href={item.href} />}
            >
              <PuzzlePieceIcon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
