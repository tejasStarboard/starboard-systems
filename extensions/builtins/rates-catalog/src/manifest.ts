/**
 * Manifest for driving built-in `rates.catalog` (tickets 073 / 086).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * - Workbench: `rates` activity + list/detail editors (`/rates`,
 *   `/rates/catalog/:resourceId` — 3-segment detail avoids colliding with
 *   ingestion's `/rates/upload`).
 * - `defines.rates.slots.ingestActions` so optional ingest can inject upload
 *   actions (`rates.ingestUpload` shared panel) without coupling.
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
            id: "rates.catalog.all",
            label: "Rate catalog",
            opens: {
              viewType: "rate.list",
              resourceId: "/rates",
              title: "Rates",
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
        viewType: "rate.list",
        displayName: "Rates",
        deepLink: "/rates",
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
