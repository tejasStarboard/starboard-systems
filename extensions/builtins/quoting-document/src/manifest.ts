/**
 * Manifest for driving built-in `quoting.document` (ticket 077 / 073 / 082).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * - `quotes` activity + `quoting.document.list` sidebar view (UI factory in
 *   `index.ts` `views`; filter/sort chrome lives in the view, not static
 *   entries).
 * - `quote` editor owns the `/quote/:resourceId` deep link; `quote.list` owns
 *   `/quotes` (static deep link); `quote.preview` owns `/preview/:resourceId`
 *   (status-bar Preview → center tab). Workbench home `/` is the New Tab
 *   welcome; this built-in contributes New Quote + Search Quotes into
 *   `workbench.newTab` and Preview into `workbench.statusBar`.
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
        description:
          "Preview body (PDF | Email) in the quote.preview center tab.",
      },
      {
        id: "quoting.slots.laneRoute",
        description:
          "FCL Route step port picker (e.g. world map). Empty → PortCombobox.",
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
      },
    ],
    editors: [
      {
        viewType: "quote",
        displayName: "Quote",
        deepLink: "/quote/:resourceId",
      },
      { viewType: "quote.list", displayName: "Quotes", deepLink: "/quotes" },
      {
        viewType: "quote.preview",
        displayName: "Preview",
        deepLink: "/preview/:resourceId",
      },
    ],
    newTab: [
      {
        id: "quoting.document.newQuote",
        label: "New Quote",
        order: 10,
        keybinding: ["mod", "N"],
        command: "quoting.document.newQuote",
      },
      {
        id: "quoting.document.searchQuotes",
        label: "Search Quotes",
        order: 20,
        keybinding: ["mod", "P"],
        opens: {
          viewType: "quote.list",
          resourceId: "/quotes",
          title: "Quotes",
        },
      },
    ],
    statusBar: [
      {
        id: "quoting.document.preview",
        label: "Preview",
        order: 10,
        opens: {
          viewType: "quote.preview",
          resourceId: "-",
          title: "Preview",
        },
      },
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
