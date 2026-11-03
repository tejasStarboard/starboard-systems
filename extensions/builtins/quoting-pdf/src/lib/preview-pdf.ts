import type { QuoteFormValues } from "@starboard/lib-contracts"

import { buildQuotePdfModel } from "./build-pdf-model"
import { renderQuotePdf } from "./render-pdf"

/**
 * Live preview bytes: the exact 083 model + renderer on current (possibly
 * unsaved) form values. Totals come from `@starboard/lib-pricing` through
 * `buildQuotePdfModel` — no second pricing path.
 */
export async function renderQuotePdfPreview(
  quote: QuoteFormValues
): Promise<Uint8Array> {
  return renderQuotePdf(buildQuotePdfModel(quote))
}
