"use client"

import Link from "next/link"
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

type SettingsItem = {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  meta?: string
}

type SettingsSection = {
  title?: string
  items: SettingsItem[]
}

const sections: SettingsSection[] = [
  {
    items: [
      {
        title: "Company",
        description:
          "Name, identifier, branding, and broader workspace settings.",
        href: "/settings/company",
        icon: <GearIcon />,
      },
      {
        title: "Team",
        description:
          "Manage workspace members and who can take certain actions.",
        href: "/settings/team",
        icon: <UsersIcon />,
      },
      {
        title: "Integrations",
        description: "Connect carriers, email, and other workspace tools.",
        href: "/settings/integrations",
        icon: <PlugsConnectedIcon />,
      },
      {
        title: "Billing",
        description: "Current plan and workspace billing details.",
        href: "/settings/billing",
        icon: <CurrencyCircleDollarIcon />,
      },
    ],
  },
  {
    title: "Quotes",
    items: [
      {
        title: "Quote rules",
        description: "Defaults and policies applied when building quotes.",
        href: "/settings/quote-rules",
        icon: <ScalesIcon />,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        description: "Your name, email, and account preferences.",
        href: "/settings/profile",
        icon: <UserCircleIcon />,
      },
      {
        title: "Preferences",
        description: "Theme, notifications, and personal workspace defaults.",
        href: "/settings/preferences",
        icon: <LockSimpleIcon />,
      },
    ],
  },
]

function SettingsRow({ item }: { item: SettingsItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4">
        {item.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{item.title}</span>
        <span className="block text-xs text-muted-foreground">
          {item.description}
        </span>
      </span>
      {item.meta ? (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {item.meta}
        </span>
      ) : null}
      <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage workspace and account preferences.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.title ?? "general"} className="space-y-3">
            {section.title ? (
              <h2 className="text-sm text-muted-foreground">{section.title}</h2>
            ) : null}
            <div className="divide-y divide-border overflow-hidden rounded-xl border bg-card">
              {section.items.map((item) => (
                <SettingsRow key={item.href} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
