/**
 * Manifest for driving built-in `quoting.email` (ticket 092).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Contributes the Email tab body into `quoting.document`'s
 * `quoting.slots.preview` point (`props.tab` routes it to the Email tab).
 * Does not define points; never sends mail (messaging is a later ticket).
 * Unplug → Email tab shows a stub; quote editor intact.
 */
export const manifest = {
  id: "quoting.email",
  version: "0.1.0",
  displayName: "Quote email preview",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    points: {
      "quoting.slots.preview": [
        {
          id: "quoting.email.preview",
          label: "Email preview",
          props: { tab: "email" },
        },
      ],
    },
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
