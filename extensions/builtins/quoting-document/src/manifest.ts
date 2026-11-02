/**
 * Manifest for driving built-in `quoting.document` (ticket 077).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * - `quotes` activity + `quoting.document.list` sidebar view (UI factory in
 *   `index.ts` `views`; the static entry opens the full list editor).
 * - `quote` editor owns the `/quote/:resourceId` deep link; `quote.list` owns
 *   the workbench home `/` (static deep link) so the quotes table opens by
 *   default, survives refresh, and is discoverable on mobile.
 */
export const manifest = {
  id: "quoting.document",
  version: "0.1.0",
  displayName: "Quote documents",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    activity: [{ id: "quotes", label: "Quotes", icon: "file-text" }],
    views: [
      {
        id: "quoting.document.list",
        name: "Quotes",
        activityId: "quotes",
        entries: [
          {
            id: "quoting.document.all",
            label: "All quotes",
            opens: {
              viewType: "quote.list",
              resourceId: "/",
              title: "Quotes",
            },
          },
        ],
      },
    ],
    editors: [
      {
        viewType: "quote",
        displayName: "Quote",
        deepLink: "/quote/:resourceId",
      },
      { viewType: "quote.list", displayName: "Quotes", deepLink: "/" },
    ],
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
