import { renderToBuffer } from "@react-pdf/renderer"

import {
  resolveQuoteDocumentOrgContext,
  type QuoteDocumentOrg,
  type QuoteFormValues,
} from "@starboard/lib-contracts"

import { buildQuoteDocumentView } from "./lib/build-document-view"
import {
  resolveQuotePdfTemplate,
  withLogoFallback,
  type QuotePdfTemplate,
} from "./templates"

/** Raw `organization` inputs the BFF hands over (name, logo, metadata JSON). */
export type QuoteOrgRecord = {
  name?: string | null
  logo?: string | null
  metadata?: unknown
}

/**
 * Org → resolved PDF template + branding, for the preview client and export.
 * `activeTemplateIds` are the active `quoting.pdf.templates` contributions
 * (host-resolved), so unplugging a contributor falls back to the default.
 */
export function resolveQuotePdfContext(input: {
  organization: QuoteOrgRecord
  activeTemplateIds: readonly string[]
}): { org: QuoteDocumentOrg; templateId: string } {
  const { org, templates } = resolveQuoteDocumentOrgContext(input.organization)
  const template = resolveQuotePdfTemplate({
    requested: templates.pdf,
    activeIds: input.activeTemplateIds,
  })
  return { org, templateId: template.id }
}

/** Export bytes: same view builder + template as the preview. */
export async function renderQuotePdfBytes(input: {
  quote: QuoteFormValues
  organization: QuoteOrgRecord
  activeTemplateIds: readonly string[]
  customerName?: string
}): Promise<{
  bytes: Uint8Array
  quoteNumber: string
  template: QuotePdfTemplate
}> {
  const { org, templateId } = resolveQuotePdfContext(input)
  const template = resolveQuotePdfTemplate({
    requested: templateId,
    activeIds: input.activeTemplateIds,
  })
  const view = buildQuoteDocumentView(input.quote, {
    org,
    customerName: input.customerName,
  })
  const bytes = await withLogoFallback(view, (next) =>
    renderToBuffer(template.renderPdf(next))
  )
  return { bytes, quoteNumber: view.quote.id, template }
}
