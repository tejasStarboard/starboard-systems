/**
 * Manifest for driving built-in `quoting.charges` (ticket 073).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Contributes into `quoting.document`'s `quoting.slots.chargeTable` (the slot
 * host mounts these only while that owner is active, in this order):
 * - `quoting.charges.table` — selected-rate grid (base, legs, globals)
 */
export const manifest = {
  id: "quoting.charges",
  version: "0.1.0",
  displayName: "Quote charges",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    points: {
      "quoting.slots.chargeTable": [
        { id: "quoting.charges.table", label: "Charge table" },
      ],
    },
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
