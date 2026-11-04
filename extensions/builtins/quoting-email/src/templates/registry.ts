import type { ReactElement } from "react"

import {
  resolveQuoteTemplateId,
  type QuoteDocumentView,
} from "@starboard/lib-contracts"

/**
 * Template contributions for the `quoting.email.templates` point (defined by
 * `quoting.email`). Same split as PDF: a manifest contribution makes the id
 * active; `registerQuoteEmailTemplate` supplies the renderer.
 */
export type QuoteEmailTemplate = {
  id: string
  label: string
  subject: (view: QuoteDocumentView) => string
  /** react-email element bound to `QuoteDocumentView` (display-only). */
  render: (view: QuoteDocumentView) => ReactElement
}

export const QUOTING_EMAIL_TEMPLATES_POINT = "quoting.email.templates"
export const DEFAULT_QUOTE_EMAIL_TEMPLATE_ID = "quoting.email.template.standard"

const templates = new Map<string, QuoteEmailTemplate>()

export function registerQuoteEmailTemplate(template: QuoteEmailTemplate) {
  templates.set(template.id, template)
}

export function listQuoteEmailTemplates(): QuoteEmailTemplate[] {
  return [...templates.values()]
}

/** Pick an org's template; unknown / inactive / missing → default. */
export function resolveQuoteEmailTemplate(input: {
  requested?: string | null
  /** Active contribution ids; omit to trust every registered template. */
  activeIds?: readonly string[]
}): QuoteEmailTemplate {
  const registeredIds = [...templates.keys()]
  const id = resolveQuoteTemplateId({
    requested: input.requested,
    activeIds: input.activeIds ?? registeredIds,
    registeredIds,
    defaultId: DEFAULT_QUOTE_EMAIL_TEMPLATE_ID,
  })
  return templates.get(id) ?? templates.get(DEFAULT_QUOTE_EMAIL_TEMPLATE_ID)!
}

export function quoteEmailSubject(view: QuoteDocumentView): string {
  const lane = view.lanes.find((item) => item.origin && item.destination)
  const route = lane ? ` · ${lane.origin} → ${lane.destination}` : ""
  return `Quote ${view.quote.id || "draft"}${route}`
}
