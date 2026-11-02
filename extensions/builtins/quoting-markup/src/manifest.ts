/**
 * Manifest for driving built-in `quoting.markup` (ticket 084).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Contributes the lane markup dial / totals footer into `quoting.document`'s
 * `quoting.slots.totals`. Unplug → totals slot empty; charge grid remains.
 */
export const manifest = {
  id: "quoting.markup",
  version: "0.1.0",
  displayName: "Quote markup",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    points: {
      "quoting.slots.totals": [
        { id: "quoting.markup.footer", label: "Markup" },
      ],
    },
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
