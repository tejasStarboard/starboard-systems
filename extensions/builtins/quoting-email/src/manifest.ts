/**
 * Manifest for driving built-in `quoting.email` (ticket 092).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Contributes the Email tab body into `quoting.document`'s
 * `quoting.slots.preview` point (`props.tab` routes it to the Email tab).
 * 094: **defines** `quoting.email.templates` (id, label; renderer registered
 * by the contributing package) and self-contributes the default "Standard"
 * plus an alternate "Letterhead" template. The org picks one via
 * `organization.metadata.quoteTemplates.email`; missing/inactive → Standard.
 * Never sends mail (messaging is a later ticket).
 * Unplug → Email tab shows a stub; quote editor intact.
 */
export const manifest = {
  id: "quoting.email",
  version: "0.1.0",
  displayName: "Quote email preview",
  requiredPlan: ["credit", "enterprise"],
  defines: {
    extensionPoints: [
      {
        id: "quoting.email.templates",
        description:
          "Email layouts bound to QuoteDocumentView (id, label, render).",
      },
    ],
  },
  contributes: {
    points: {
      "quoting.email.templates": [
        {
          id: "quoting.email.template.standard",
          label: "Standard",
          order: 0,
        },
        {
          id: "quoting.email.template.letterhead",
          label: "Letterhead",
          order: 10,
        },
      ],
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
