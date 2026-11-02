/**
 * Manifest for driving built-in `rates.catalog` (ticket 076 stub).
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 */
export const manifest = {
  id: "rates.catalog",
  version: "0.0.0",
  displayName: "Rates catalog (stub)",
  requiredPlan: ["credit", "enterprise"],
  contributes: {},
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
