/** Settings pages the `settings` editor can render, keyed by resource id (slug). */
export const SETTINGS_PAGES = [
  {
    slug: "company",
    title: "Company",
    description: "Name, identifier, branding, and broader workspace settings.",
    icon: "gear",
    section: "",
  },
  {
    slug: "team",
    title: "Team",
    description: "Manage workspace members and who can take certain actions.",
    icon: "users",
    section: "",
  },
  {
    slug: "integrations",
    title: "Integrations",
    description: "Connect carriers, email, and other workspace tools.",
    icon: "plugs",
    section: "",
  },
  {
    slug: "billing",
    title: "Billing",
    description: "Current plan and workspace billing details.",
    icon: "currency",
    section: "",
  },
  {
    slug: "quote-rules",
    title: "Quote rules",
    description: "Defaults and policies applied when building quotes.",
    icon: "scales",
    section: "Quotes",
  },
  {
    slug: "profile",
    title: "Profile",
    description: "Your name, email, and account preferences.",
    icon: "user",
    section: "Account",
  },
  {
    slug: "preferences",
    title: "Preferences",
    description: "Theme, notifications, and personal workspace defaults.",
    icon: "lock",
    section: "Account",
  },
] as const

export type SettingsSlug = (typeof SETTINGS_PAGES)[number]["slug"]

export function findSettingsPage(slug: string) {
  return SETTINGS_PAGES.find((page) => page.slug === slug)
}
