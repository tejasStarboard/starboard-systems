/**
 * Manifest for driving built-in `geo.gazetteer` (ticket 078).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Contributes no workbench UI: it exports port / address combobox widgets
 * (`widgets`) consumed by quote lane fields (and available for slot
 * contributions later). Data comes from `/api/geography/*` (BFF →
 * `services/geography`).
 */
export const manifest = {
  id: "geo.gazetteer",
  version: "0.1.0",
  displayName: "Geography gazetteer",
  requiredPlan: ["credit", "enterprise"],
  contributes: {},
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
