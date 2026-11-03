/**
 * Manifest for driving built-in `quoting.pdf` (ticket 083).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * Contributes Export PDF into `quoting.document`'s `quoting.commands` point
 * and the PDF tab body into `quoting.slots.preview` (092; `props.tab` routes
 * it). Does not define points. Unplug → no export control and a PDF-tab stub;
 * quote editor intact.
 */
export const manifest = {
  id: "quoting.pdf",
  version: "0.1.0",
  displayName: "Quote PDF export",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    points: {
      "quoting.commands": [{ id: "quoting.pdf.export", label: "Export PDF" }],
      "quoting.slots.preview": [
        {
          id: "quoting.pdf.preview",
          label: "PDF preview",
          props: { tab: "pdf" },
        },
      ],
    },
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest
