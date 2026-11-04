import type { QuoteDocumentOrg } from "./quote-document-view.js"

/**
 * Org-level inputs for quote templates, read from Better Auth
 * `organization` (name, logo) + `metadata` JSON:
 *
 *   { "quoteTemplates": { "pdf": "<id>", "email": "<id>" },
 *     "letterhead": { "addressLines": [...], "email", "phone", "website",
 *                     "footerNote" } }
 *
 * Both keys are optional; missing/invalid → defaults (default templates,
 * blank letterhead). Unknown metadata keys are ignored here.
 */
export type QuoteTemplateSelection = { pdf?: string; email?: string }

export type QuoteDocumentOrgContext = {
  org: QuoteDocumentOrg
  templates: QuoteTemplateSelection
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function id(value: unknown): string | undefined {
  const trimmed = text(value)
  return trimmed || undefined
}

function httpUrl(value: unknown): string | null {
  const raw = text(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === "https:" || url.protocol === "http:" ? raw : null
  } catch {
    return null
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function resolveQuoteDocumentOrgContext(input: {
  name?: string | null
  logo?: string | null
  /** Raw `organization.metadata` (JSON text or object). */
  metadata?: unknown
}): QuoteDocumentOrgContext {
  let metadata: unknown = input.metadata
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata)
    } catch {
      metadata = null
    }
  }
  const root = record(metadata)
  const letterhead = record(root.letterhead)
  const templates = record(root.quoteTemplates)
  const addressLines = Array.isArray(letterhead.addressLines)
    ? letterhead.addressLines.map(text).filter(Boolean)
    : []
  return {
    org: {
      name: text(input.name),
      logoUrl: httpUrl(input.logo),
      letterhead: {
        addressLines,
        email: text(letterhead.email),
        phone: text(letterhead.phone),
        website: text(letterhead.website),
        footerNote: text(letterhead.footerNote),
      },
    },
    templates: { pdf: id(templates.pdf), email: id(templates.email) },
  }
}

export function emptyQuoteDocumentOrg(): QuoteDocumentOrg {
  return resolveQuoteDocumentOrgContext({}).org
}
