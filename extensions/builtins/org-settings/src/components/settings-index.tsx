"use client"

import type { ReactNode } from "react"
import {
  CaretRightIcon,
  CurrencyCircleDollarIcon,
  GearIcon,
  LockSimpleIcon,
  PlugsConnectedIcon,
  ScalesIcon,
  UserCircleIcon,
  UsersIcon,
} from "@phosphor-icons/react"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@starboard/lib-ui/components/card"

import type { BuiltinHost } from "../host"
import { SETTINGS_PAGES } from "../lib/settings-pages"

const ICONS: Record<string, ReactNode> = {
  gear: <GearIcon />,
  users: <UsersIcon />,
  plugs: <PlugsConnectedIcon />,
  currency: <CurrencyCircleDollarIcon />,
  scales: <ScalesIcon />,
  user: <UserCircleIcon />,
  lock: <LockSimpleIcon />,
}

const SECTIONS = ["", "Quotes", "Account"] as const

/** Settings overview; each row opens the `settings` editor tab for that page. */
export function SettingsIndex({ host }: { host: BuiltinHost }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage workspace and account preferences.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section || "general"} className="space-y-3">
            {section ? (
              <h2 className="text-sm text-muted-foreground">{section}</h2>
            ) : null}
            <Card size="sm" className="gap-0 py-0 ring-foreground/10">
              {SETTINGS_PAGES.filter((page) => page.section === section).map(
                (page) => (
                  <Button
                    key={page.slug}
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      host.openEditor({
                        viewType: "settings",
                        resourceId: page.slug,
                        title: page.title,
                      })
                    }
                    className="h-auto w-full justify-start gap-3 rounded-none border-b border-border px-4 py-3 text-left last:border-b-0"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4">
                      {ICONS[page.icon]}
                    </span>
                    <CardHeader className="min-w-0 flex-1 gap-0.5 p-0 px-0">
                      <CardTitle className="text-sm font-medium">
                        {page.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {page.description}
                      </CardDescription>
                    </CardHeader>
                    <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                )
              )}
            </Card>
          </section>
        ))}
      </div>
    </div>
  )
}
