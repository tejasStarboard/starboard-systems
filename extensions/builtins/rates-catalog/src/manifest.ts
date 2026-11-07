/**
 * Manifest for driving built-in `rates.catalog` (tickets 073 / 086 / 096).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * - Workbench: `rates` activity + Search / Sheets / Sell / Spot sidebar
 *   editors (`/rates/search|sheets|sell|spot`). Detail stays
 *   `/rates/catalog/:resourceId` (avoids `/rates/upload`).
 * - Catalog list CRUD lives under Rate Sheets until 099 polish.
 * - `defines.rates.slots.ingestActions` + `rates.slots.spotSearch` (098).
 * - Still contributes catalog search into `quoting.slots.rateSources`.
 */
export const manifest = {
  id: "rates.catalog",
  version: "0.1.0",
  displayName: "Rates catalog",
  requiredPlan: ["credit", "enterprise"],
  defines: {
    extensionPoints: [
      {
        id: "rates.slots.ingestActions",
        description:
          "Toolbar / actions on the rates catalog list (rate-sheet upload, …).",
      },
      {
        id: "rates.slots.spotSearch",
        description:
          "Standalone Spot search UI in the Rates activity (no quote document).",
      },
    ],
  },
  contributes: {
    activity: [{ id: "rates", label: "Rates", icon: "squares-four" }],
    views: [
      {
        id: "rates.catalog.list",
        name: "Rates",
        activityId: "rates",
        entries: [
          {
            id: "rates.catalog.search",
            label: "Search Rates",
            opens: {
              viewType: "rate.search",
              resourceId: "/rates/search",
              title: "Search Rates",
            },
          },
          {
            id: "rates.catalog.sheets",
            label: "Rate Sheets",
            opens: {
              viewType: "rate.sheets",
              resourceId: "/rates/sheets",
              title: "Rate Sheets",
            },
          },
          {
            id: "rates.catalog.sell",
            label: "Sell Rates",
            opens: {
              viewType: "rate.sell",
              resourceId: "/rates/sell",
              title: "Sell Rates",
            },
          },
          {
            id: "rates.catalog.spot",
            label: "Spot search",
            opens: {
              viewType: "rate.spotSearch",
              resourceId: "/rates/spot",
              title: "Spot search",
            },
          },
        ],
      },
    ],
    editors: [
      {
        viewType: "rate",
        displayName: "Rate",
        deepLink: "/rates/catalog/:resourceId",
      },
      {
        viewType: "rate.search",
        displayName: "Search Rates",
        deepLink: "/rates/search",
      },
      {
        viewType: "rate.sheets",
        displayName: "Rate Sheets",
        deepLink: "/rates/sheets",
      },
      {
        viewType: "rate.sell",
        displayName: "Sell Rates",
        deepLink: "/rates/sell",
      },
      {
        viewType: "rate.spotSearch",
        displayName: "Spot search",
        deepLink: "/rates/spot",
      },
    ],
    newTab: [
      {
        id: "rates.catalog.uploadRates",
        label: "Upload Rates",
        order: 30,
        keybinding: ["mod", "U"],
        opens: {
          viewType: "rate.sheets",
          resourceId: "/rates/sheets",
          title: "Rate Sheets",
        },
      },
      {
        id: "rates.catalog.searchRates",
        label: "Search Rates",
        order: 40,
        keybinding: ["mod", "shift", "R"],
        opens: {
          viewType: "rate.search",
          resourceId: "/rates/search",
          title: "Search Rates",
        },
      },
    ],
    points: {
      "quoting.slots.rateSources": [
        {
          id: "rates.catalog.source",
          label: "Catalog rates",
          // After spot sources (default order 0), as before the slot split.
          order: 100,
        },
      ],
    },
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
