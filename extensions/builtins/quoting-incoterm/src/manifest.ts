/**
 * Manifest for driving built-in `quoting.incoterm` (ticket 084).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Contributes Incoterm + customer-role controls into `quoting.document`'s
 * `quoting.slots.headerFields`. Unplug → headerFields empty; quote opens.
 */
export const manifest = {
  id: "quoting.incoterm",
  version: "0.1.0",
  displayName: "Quote Incoterm",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    points: {
      "quoting.slots.headerFields": [
        { id: "quoting.incoterm.fields", label: "Incoterm" },
      ],
    },
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
