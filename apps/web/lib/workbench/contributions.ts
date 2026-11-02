import { EMPTY_CONTRIBUTIONS, type WorkbenchContributions } from "./types"

/**
 * TEMPORARY compatibility shim (074).
 *
 * Today's quote / customers / settings / extension pages are still owned by
 * `apps/web` route trees. This describes them as workbench contributions so the
 * kernel shell can host them. Ticket 077 moves quote into `quoting.document`
 * (contributing its own sidebar view + `quote` editor); 078 does CRM + settings.
 * Delete this file once built-ins contribute through the extension host.
 */
export function legacyShellContributions(
  extensionNav: ReadonlyArray<{ id: string; label: string; href: string }> = []
): WorkbenchContributions {
  const settingsPages = [
    ["company", "Company"],
    ["team", "Team"],
    ["profile", "Profile"],
    ["preferences", "Preferences"],
    ["integrations", "Integrations"],
    ["quote-rules", "Quote rules"],
    ["billing", "Billing"],
  ] as const

  return {
    activity: [
      { id: "quotes", label: "Quotes", icon: "file-text" },
      { id: "customers", label: "Customers", icon: "address-book" },
      { id: "settings", label: "Settings", icon: "gear" },
      ...(extensionNav.length > 0
        ? [{ id: "extensions", label: "Extensions", icon: "puzzle" }]
        : []),
    ],
    views: [
      {
        id: "quotes.list",
        name: "Quotes",
        activityId: "quotes",
        entries: [{ id: "quotes.all", label: "All quotes", href: "/" }],
      },
      {
        id: "customers.list",
        name: "Customers",
        activityId: "customers",
        entries: [
          { id: "customers.all", label: "All customers", href: "/customers" },
        ],
      },
      {
        id: "settings.pages",
        name: "Settings",
        activityId: "settings",
        entries: settingsPages.map(([slug, label]) => ({
          id: `settings.${slug}`,
          label,
          href: `/settings/${slug}`,
        })),
      },
      ...(extensionNav.length > 0
        ? [
            {
              id: "extensions.nav",
              name: "Extensions",
              activityId: "extensions",
              entries: extensionNav.map((item) => ({
                id: item.id,
                label: item.label,
                href: item.href,
              })),
            },
          ]
        : []),
    ],
    editors: [
      {
        viewType: "quote",
        displayName: "Quote",
        deepLink: "/quote/:resourceId",
      },
      {
        viewType: "customer",
        displayName: "Customer",
        deepLink: "/customers/:resourceId",
      },
      // Catch-all for remaining legacy pages (settings, rates upload, inbox, …).
      { viewType: "page", displayName: "Page", deepLink: "/*" },
    ],
  }
}

export function resolveWorkbenchContributions(options: {
  kernelOnly: boolean
  extensionNav?: ReadonlyArray<{ id: string; label: string; href: string }>
}): WorkbenchContributions {
  if (options.kernelOnly) return EMPTY_CONTRIBUTIONS
  return legacyShellContributions(options.extensionNav)
}

/** `WORKBENCH_KERNEL_ONLY` = `1` | `true` → empty workbench lab. */
export function isKernelOnlyFlag(value: string | undefined): boolean {
  return value === "1" || value === "true"
}
