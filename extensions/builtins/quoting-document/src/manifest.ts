/**
 * Manifest for driving built-in `quoting.document` (ticket 077 / 073 / 082).
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
 * - `defines.extensionPoints` (073 / 082): the quote editor owns these slots;
 *   charges, rate sources, Incoterm, markup, PDF, … contribute into them. The
 *   kernel never names them. Self-contributes lifecycle chrome into
 *   `quoting.slots.lifecycle`. `quoting.totalsHooks` is headless.
 */
export const manifest = {
  id: "quoting.document",
  version: "0.1.0",
  displayName: "Quote documents",
  requiredPlan: ["credit", "enterprise"],
  defines: {
    extensionPoints: [
      {
        id: "quoting.slots.headerFields",
        description: "Header region of the quote editor (extra fields).",
      },
      {
        id: "quoting.slots.chargeTable",
        description: "Charge grid region of the selected lane.",
      },
      {
        id: "quoting.slots.totals",
        description: "Footer / markup region below the charge grid.",
      },
      {
        id: "quoting.slots.rateSources",
        description: "Search/apply rates sheet (catalog, spot, …).",
      },
      {
        id: "quoting.slots.lifecycle",
        description: "Stage, validity, and quote-number chrome.",
      },
      {
        id: "quoting.slots.preview",
        description: "Preview pane body (PDF | Email) beside the builder.",
      },
      {
        id: "quoting.commands",
        description: "Editor toolbar actions (PDF, send, …).",
      },
      {
        id: "quoting.totalsHooks",
        description:
          "Headless hooks into the totals pipeline (not hosted yet).",
      },
    ],
  },
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
    points: {
      "quoting.slots.lifecycle": [
        { id: "quoting.document.lifecycle", label: "Lifecycle" },
      ],
    },
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
