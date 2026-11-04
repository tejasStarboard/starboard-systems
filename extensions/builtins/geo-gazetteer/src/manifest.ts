/**
 * Manifest for driving built-in `geo.gazetteer` (ticket 078).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Exports port / address combobox widgets (`widgets`) consumed by quote lane
 * fields. Contributes the FCL world-map route picker (ticket 090) into
 * `quoting.document`'s `quoting.slots.laneRoute`. Unplug (or map off) →
 * Route step falls back to `PortCombobox`. Data comes from `/api/geography/*`
 * (BFF → `services/geography`).
 */
export const manifest = {
  id: "geo.gazetteer",
  version: "0.1.0",
  displayName: "Geography gazetteer",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    points: {
      "quoting.slots.laneRoute": [
        { id: "geo.gazetteer.routeMap", label: "FCL route map" },
      ],
    },
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
