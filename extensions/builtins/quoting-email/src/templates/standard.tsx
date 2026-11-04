import { EmailLayout } from "@starboard/lib-email/templates"
import type { QuoteDocumentView } from "@starboard/lib-contracts"

import { QuoteBody } from "./parts"
import {
  DEFAULT_QUOTE_EMAIL_TEMPLATE_ID,
  quoteEmailSubject,
  registerQuoteEmailTemplate,
  type QuoteEmailTemplate,
} from "./registry"

/** Default `quoting.email.templates` contribution (migrated QuoteDraftEmail). */
export function StandardQuoteEmail({ view }: { view: QuoteDocumentView }) {
  return (
    <EmailLayout
      preview={quoteEmailSubject(view)}
      heading={`Quote ${view.quote.id || "draft"}`}
      width={600}
    >
      <QuoteBody view={view} />
    </EmailLayout>
  )
}

export const standardQuoteEmailTemplate: QuoteEmailTemplate = {
  id: DEFAULT_QUOTE_EMAIL_TEMPLATE_ID,
  label: "Standard",
  subject: quoteEmailSubject,
  render: (view) => <StandardQuoteEmail view={view} />,
}

registerQuoteEmailTemplate(standardQuoteEmailTemplate)
