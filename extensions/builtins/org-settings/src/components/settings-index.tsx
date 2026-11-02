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
            <div className="divide-y divide-border overflow-hidden border">
              {SETTINGS_PAGES.filter((page) => page.section === section).map(
                (page) => (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() =>
                      host.openEditor({
                        viewType: "settings",
                        resourceId: page.slug,
                        title: page.title,
                      })
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4">
                      {ICONS[page.icon]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {page.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {page.description}
                      </span>
                    </span>
                    <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
