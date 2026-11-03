import type { ComponentType } from "react"

import { ExportPdfButton } from "./commands/export-pdf-button"
import { PdfPreview } from "./slots/pdf-preview"

export { manifest, type BuiltinManifest } from "./manifest"
export { buildQuotePdfModel } from "./lib/build-pdf-model"
export { renderQuotePdf } from "./lib/render-pdf"
export { renderQuotePdfPreview } from "./lib/preview-pdf"

/**
 * UI factories for contributions into `quoting.document` points, keyed by
 * contribution id. Kernel merges into `builtinPointComponents`.
 */
export const pointComponents: Readonly<
  Record<"quoting.pdf.export" | "quoting.pdf.preview", ComponentType<never>>
> = {
  "quoting.pdf.export": ExportPdfButton as ComponentType<never>,
  "quoting.pdf.preview": PdfPreview as ComponentType<never>,
}
