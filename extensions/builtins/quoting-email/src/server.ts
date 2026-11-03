import type { QuoteFormValues } from "@starboard/lib-contracts"
import { buildQuotePdfModel } from "@starboard/ext-quoting-pdf/model"
import { renderQuoteDraftEmail } from "@starboard/lib-email/templates"

/**
 * Server-side: quote form values → react-email HTML. Amounts come from the
 * same `buildQuotePdfModel` as the 083 PDF (ONE MATH via `@starboard/lib-pricing`);
 * the template is display-only.
 */
export async function renderQuoteEmailPreview(input: {
  quote: QuoteFormValues
  customerName?: string
}): Promise<{ subject: string; html: string }> {
  const model = buildQuotePdfModel(input.quote)
  return renderQuoteDraftEmail({ ...model, customerName: input.customerName })
}
