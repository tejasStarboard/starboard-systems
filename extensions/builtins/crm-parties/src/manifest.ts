/**
 * Manifest for driving built-in `crm.parties` (ticket 076 stub).
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 */
export const manifest = {
  id: "crm.parties",
  version: "0.0.0",
  displayName: "CRM parties (stub)",
  requiredPlan: ["credit", "enterprise"],
  contributes: {},
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
