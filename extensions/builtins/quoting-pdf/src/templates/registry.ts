import type { ReactElement } from "react"
import type { DocumentProps } from "@react-pdf/renderer"

import {
  resolveQuoteTemplateId,
  type QuoteDocumentView,
} from "@starboard/lib-contracts"

/**
 * Template contributions for the `quoting.pdf.templates` point (defined by
 * `quoting.pdf`). A manifest contribution makes a template id *active*
 * (plan / rollout / unplug aware); `registerQuotePdfTemplate` supplies its
 * renderer. Tenants/extensions add layouts by doing both — no kernel change.
 */
export type QuotePdfTemplate = {
  id: string
  label: string
  /** Display-only: bind to `QuoteDocumentView`, never to the raw form. */
  renderPdf: (view: QuoteDocumentView) => ReactElement<DocumentProps>
}

export const QUOTING_PDF_TEMPLATES_POINT = "quoting.pdf.templates"
export const DEFAULT_QUOTE_PDF_TEMPLATE_ID = "quoting.pdf.template.standard"

const templates = new Map<string, QuotePdfTemplate>()

export function registerQuotePdfTemplate(template: QuotePdfTemplate) {
  templates.set(template.id, template)
}

export function listQuotePdfTemplates(): QuotePdfTemplate[] {
  return [...templates.values()]
}

/** Pick an org's template; unknown / inactive / missing → default. */
export function resolveQuotePdfTemplate(input: {
  requested?: string | null
  /** Active contribution ids; omit to trust every registered template. */
  activeIds?: readonly string[]
}): QuotePdfTemplate {
  const registeredIds = [...templates.keys()]
  const id = resolveQuoteTemplateId({
    requested: input.requested,
    activeIds: input.activeIds ?? registeredIds,
    registeredIds,
    defaultId: DEFAULT_QUOTE_PDF_TEMPLATE_ID,
  })
  return templates.get(id) ?? templates.get(DEFAULT_QUOTE_PDF_TEMPLATE_ID)!
}

/**
 * A logo URL that fails to load must not break export/preview: retry the
 * render once without the logo.
 */
export async function withLogoFallback<T>(
  view: QuoteDocumentView,
  render: (view: QuoteDocumentView) => Promise<T>
): Promise<T> {
  try {
    return await render(view)
  } catch (error) {
    if (!view.org.logoUrl) throw error
    return render({ ...view, org: { ...view.org, logoUrl: null } })
  }
}
