/**
 * Manifest for driving built-in `org.settings` (ticket 078).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * - `settings` activity + `org.settings.pages` view (static entries that open
 *   editor tabs).
 * - `settings` editor owns `/settings/:resourceId` (resource id = page slug:
 *   company, team, integrations, billing, profile, preferences; the retired
 *   `quote-rules` slug resolves to Preferences → Quote).
 * - `settings.index` owns `/settings` (overview).
 */
export const manifest = {
  id: "org.settings",
  version: "0.1.0",
  displayName: "Organization settings",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    activity: [{ id: "settings", label: "Settings", icon: "gear" }],
    views: [
      {
        id: "org.settings.pages",
        name: "Settings",
        activityId: "settings",
        entries: [
          {
            id: "org.settings.overview",
            label: "Overview",
            opens: {
              viewType: "settings.index",
              resourceId: "/settings",
              title: "Settings",
            },
          },
          {
            id: "org.settings.company",
            label: "Company",
            opens: {
              viewType: "settings",
              resourceId: "company",
              title: "Company",
            },
          },
          {
            id: "org.settings.team",
            label: "Team",
            opens: {
              viewType: "settings",
              resourceId: "team",
              title: "Team",
            },
          },
          {
            id: "org.settings.integrations",
            label: "Integrations",
            opens: {
              viewType: "settings",
              resourceId: "integrations",
              title: "Integrations",
            },
          },
          {
            id: "org.settings.billing",
            label: "Billing",
            opens: {
              viewType: "settings",
              resourceId: "billing",
              title: "Billing",
            },
          },
          {
            id: "org.settings.profile",
            label: "Profile",
            opens: {
              viewType: "settings",
              resourceId: "profile",
              title: "Profile",
            },
          },
          {
            id: "org.settings.preferences",
            label: "Preferences",
            opens: {
              viewType: "settings",
              resourceId: "preferences",
              title: "Preferences",
            },
          },
        ],
      },
    ],
    editors: [
      {
        viewType: "settings",
        displayName: "Settings",
        deepLink: "/settings/:resourceId",
      },
      {
        viewType: "settings.index",
        displayName: "Settings",
        deepLink: "/settings",
      },
    ],
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
