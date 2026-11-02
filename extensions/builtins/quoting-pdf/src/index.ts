import type { ComponentType } from "react"

import { ExportPdfButton } from "./commands/export-pdf-button"

export { manifest, type BuiltinManifest } from "./manifest"
export { buildQuotePdfModel } from "./lib/build-pdf-model"
export { renderQuotePdf } from "./lib/render-pdf"

/**
 * UI factories for contributions into `quoting.document` points, keyed by
 * contribution id. Kernel merges into `builtinPointComponents`.
 */
export const pointComponents: Readonly<
  Record<"quoting.pdf.export", ComponentType<never>>
> = {
  "quoting.pdf.export": ExportPdfButton as ComponentType<never>,
}
