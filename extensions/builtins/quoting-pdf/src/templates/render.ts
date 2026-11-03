import { pdf } from "@react-pdf/renderer"

import type { QuoteDocumentView } from "@starboard/lib-contracts"

import { withLogoFallback, type QuotePdfTemplate } from "./registry"

/** Browser: view + template → PDF blob (Preview tab → blob URL, 092/094). */
export function renderQuotePdfBlob(
  view: QuoteDocumentView,
  template: QuotePdfTemplate
): Promise<Blob> {
  return withLogoFallback(view, (next) =>
    pdf(template.renderPdf(next)).toBlob()
  )
}
