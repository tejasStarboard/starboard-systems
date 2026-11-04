import { z } from "zod"

/**
 * `QuoteDocumentView` (ticket 094): the ONE stable, display-only shape every
 * quote template (PDF, email, tenant custom) binds to. Built once from the
 * quote form + org context by `buildQuoteDocumentView` (`quoting.pdf`) with
 * all amounts from `@starboard/lib-pricing` — templates never do math and
 * never read the raw form.
 */
export const QUOTE_DOCUMENT_VIEW_VERSION = 1 as const

export const quoteDocumentLetterheadSchema = z.object({
  addressLines: z.array(z.string()),
  email: z.string(),
  phone: z.string(),
  website: z.string(),
  /** Free-text footer (registration no., bank details, …). */
  footerNote: z.string(),
})
export type QuoteDocumentLetterhead = z.infer<
  typeof quoteDocumentLetterheadSchema
>

export const quoteDocumentOrgSchema = z.object({
  name: z.string(),
  /** Absolute http(s) URL, or null (templates must tolerate missing logos). */
  logoUrl: z.string().nullable(),
  letterhead: quoteDocumentLetterheadSchema,
})
export type QuoteDocumentOrg = z.infer<typeof quoteDocumentOrgSchema>

export const quoteDocumentChargeSchema = z.object({
  name: z.string(),
  leg: z.enum(["origin", "freight", "destination", "global"]),
  /** Currency of `amount`: the quote currency when set (FX applied), else the line's. */
  currencyCode: z.string(),
  /** The line's own currency before FX (display hint, e.g. "EUR 100 at 1.1"). */
  sourceCurrencyCode: z.string().optional(),
  /**
   * Contribution to the lane/quote total (ONE MATH, post usage / % / FX / per-CT
   * × count). Null when the row is dropped (Incoterm scope, removed, not included).
   */
  amount: z.number().nullable(),
  included: z.boolean(),
  absorbed: z.boolean(),
  note: z.string().optional(),
})
export type QuoteDocumentCharge = z.infer<typeof quoteDocumentChargeSchema>

export const quoteDocumentSectionSchema = z.object({
  leg: z.enum(["origin", "freight", "destination"]),
  label: z.string(),
  charges: z.array(quoteDocumentChargeSchema),
})
export type QuoteDocumentSection = z.infer<typeof quoteDocumentSectionSchema>

export const quoteDocumentLaneSchema = z.object({
  index: z.number().int(),
  mode: z.string(),
  origin: z.string(),
  originVia: z.string(),
  destinationVia: z.string(),
  destination: z.string(),
  /** Door pickup / delivery labels (empty when port-to-port). */
  pickup: z.string(),
  delivery: z.string(),
  cargo: z.object({
    /** Human one-liner, e.g. "2 × 40HC · 20,000 kg". */
    summary: z.string(),
    containers: z.array(
      z.object({ type: z.string(), count: z.number(), weightKg: z.number() })
    ),
    weightKg: z.number(),
    volumeCbm: z.number(),
    palletCount: z.number(),
  }),
  rateLabel: z.string(),
  /** Origin / freight / destination sections (empty sections omitted). */
  sections: z.array(quoteDocumentSectionSchema),
  /** ONE MATH per lane (`calculateManualRateTotals`). */
  subtotal: z.number(),
  markup: z.number(),
  total: z.number(),
})
export type QuoteDocumentLane = z.infer<typeof quoteDocumentLaneSchema>

export const quoteDocumentViewSchema = z.object({
  schemaVersion: z.literal(QUOTE_DOCUMENT_VIEW_VERSION),
  org: quoteDocumentOrgSchema,
  quote: z.object({
    /** Human quote number (falls back to the row id). */
    id: z.string(),
    status: z.string(),
    /** Base currency; blank stays blank (never invented). */
    currencyCode: z.string(),
    incoterm: z.string(),
    customerRole: z.string(),
    effectiveFrom: z.string(),
    expiryAt: z.string(),
  }),
  customer: z.object({ name: z.string() }),
  lanes: z.array(quoteDocumentLaneSchema),
  /** Quote-level (global) charges, listed once after the lanes. */
  globals: z.array(quoteDocumentChargeSchema),
  excludedBuckets: z.array(z.string()),
  totals: z.object({
    currencyCode: z.string(),
    subtotal: z.number(),
    markup: z.number(),
    /** Sum of lane totals (globals roll into lane 1 only, as in the editor). */
    grandTotal: z.number(),
  }),
  notes: z.array(z.string()),
})
export type QuoteDocumentView = z.infer<typeof quoteDocumentViewSchema>

/** `money("USD", 5)` → `USD 5.00`; blank currency → bare amount. */
export function formatQuoteMoney(
  currencyCode: string,
  amount: number | null
): string {
  if (amount == null) return "-"
  const value = amount.toFixed(2)
  return currencyCode ? `${currencyCode} ${value}` : value
}

/**
 * Template id resolution: the org's pick wins only while it is both an
 * active contribution (owner + contributor on, plan/rollout) and registered
 * by the extension; otherwise fall back to the default.
 */
export function resolveQuoteTemplateId(input: {
  requested?: string | null
  activeIds: readonly string[]
  registeredIds: readonly string[]
  defaultId: string
}): string {
  const { requested, activeIds, registeredIds, defaultId } = input
  if (
    requested &&
    activeIds.includes(requested) &&
    registeredIds.includes(requested)
  ) {
    return requested
  }
  return defaultId
}
