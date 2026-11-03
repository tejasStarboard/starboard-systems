import { render } from "@react-email/components"

import {
  resolveQuoteDocumentOrgContext,
  type QuoteFormValues,
} from "@starboard/lib-contracts"
import { buildQuoteDocumentView } from "@starboard/ext-quoting-pdf/view"

import { resolveQuoteEmailTemplate } from "./templates"

export type QuoteOrgRecord = {
  name?: string | null
  logo?: string | null
  metadata?: unknown
}

/**
 * Server-side: quote form values → react-email HTML. The same
 * `buildQuoteDocumentView` as the PDF (ONE MATH via `@starboard/lib-pricing`);
 * the org-selected `quoting.email.templates` template is display-only.
 * `activeTemplateIds` = host-resolved active contributions (unplug → default).
 */
export async function renderQuoteEmailPreview(input: {
  quote: QuoteFormValues
  customerName?: string
  organization?: QuoteOrgRecord
  activeTemplateIds?: readonly string[]
}): Promise<{ subject: string; html: string; templateId: string }> {
  const { org, templates } = resolveQuoteDocumentOrgContext(
    input.organization ?? {}
  )
  const template = resolveQuoteEmailTemplate({
    requested: templates.email,
    activeIds: input.activeTemplateIds,
  })
  const view = buildQuoteDocumentView(input.quote, {
    org,
    customerName: input.customerName,
  })
  return {
    subject: template.subject(view),
    html: await render(template.render(view)),
    templateId: template.id,
  }
}
