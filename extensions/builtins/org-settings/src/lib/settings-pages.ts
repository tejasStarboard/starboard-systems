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
    slug: "profile",
    title: "Profile",
    description: "Your name, email, and account preferences.",
    icon: "user",
    section: "Account",
  },
  {
    slug: "preferences",
    title: "Preferences",
    description: "App theme plus quote defaults (validity, base currency).",
    icon: "lock",
    section: "Account",
  },
] as const

export type SettingsSlug = (typeof SETTINGS_PAGES)[number]["slug"]

/**
 * Retired slugs that still resolve (old links / restored tabs): slug →
 * the page + section they now live in.
 */
export const SETTINGS_SLUG_ALIASES: Readonly<
  Record<string, { slug: SettingsSlug; section: "app" | "quote" }>
> = {
  "quote-rules": { slug: "preferences", section: "quote" },
}

export function findSettingsPage(slug: string) {
  return SETTINGS_PAGES.find((page) => page.slug === slug)
}
