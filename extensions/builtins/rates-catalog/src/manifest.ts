/**
 * Manifest for driving built-in `rates.catalog` (ticket 073).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Contributes the catalog rate search into `quoting.document`'s
 * `quoting.slots.rateSources` (apply-to-lane). It also exports the generic
 * spot-source panel (`rates.spotSource`) that optional `spot.*` workers
 * reference via `component` so they need no JS package.
 */
export const manifest = {
  id: "rates.catalog",
  version: "0.1.0",
  displayName: "Rates catalog",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
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
