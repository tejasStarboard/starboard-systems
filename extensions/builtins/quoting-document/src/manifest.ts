/**
 * Manifest for driving built-in `quoting.document` (ticket 076 stub).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Stub contributions only — the real quote editor moves here in 077.
 * - `quotes` activity: same id as the legacy shell shim (base wins on merge);
 *   077 deletes the shim and this contribution takes over.
 * - `quote.stub` editor: distinct viewType so it does not collide with the
 *   route-backed legacy `quote` editor. 077 renames it to `quote`.
 */
export const manifest = {
  id: "quoting.document",
  version: "0.0.0",
  displayName: "Quote documents (stub)",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    activity: [{ id: "quotes", label: "Quotes", icon: "file-text" }],
    views: [
      {
        id: "quoting.document.stub",
        name: "Quotes (stub)",
        activityId: "quotes",
        entries: [
          {
            id: "quoting.document.stub.open",
            label: "Open stub quote",
            opens: {
              viewType: "quote.stub",
              resourceId: "stub-1",
              title: "Stub quote",
            },
          },
        ],
      },
    ],
    editors: [{ viewType: "quote.stub", displayName: "Quote (stub)" }],
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
