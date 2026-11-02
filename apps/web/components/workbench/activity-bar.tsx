"use client"

import {
  AddressBookIcon,
  FileTextIcon,
  GearIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react"
import Link from "next/link"

import { WorkbenchUserMenu } from "@/components/workbench/user-menu"
import { useWorkbench } from "@/components/workbench/workbench-context"
import { Button } from "@starboard/lib-ui/components/button"
import { cn } from "@starboard/lib-ui/lib/utils"

const ICONS: Record<string, React.ReactNode> = {
  "file-text": <FileTextIcon />,
  "address-book": <AddressBookIcon />,
  gear: <GearIcon />,
  puzzle: <PuzzlePieceIcon />,
}

export function ActivityBar({
  user,
  showAdminNav,
}: {
  user: { name: string; email: string; image?: string | null }
  showAdminNav: boolean
}) {
  const { contributions, activeActivityId, sidebarOpen, selectActivity } =
    useWorkbench()

  return (
    <nav
      aria-label="Activity bar"
      data-region="activity-bar"
      className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-2"
    >
      {contributions.activity.map((activity) => {
        const active = sidebarOpen && activity.id === activeActivityId
        return (
          <Button
            key={activity.id}
            variant={active ? "secondary" : "ghost"}
            size="icon"
            aria-label={activity.label}
            aria-pressed={active}
            title={activity.label}
            className={cn("size-9", active && "text-foreground")}
            onClick={() => selectActivity(activity.id)}
          >
            {(activity.icon && ICONS[activity.icon]) ?? <SquaresFourIcon />}
          </Button>
        )
      })}
      <div className="mt-auto flex flex-col items-center gap-1">
        {showAdminNav ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Admin"
            title="Admin"
            className="size-9"
            render={<Link href="/admin" />}
          >
            <ShieldCheckIcon />
          </Button>
        ) : null}
        <WorkbenchUserMenu user={user} />
      </div>
    </nav>
  )
}
