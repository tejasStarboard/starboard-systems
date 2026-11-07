import type { QuoteStatus } from "@starboard/lib-contracts"

const TERMINAL: ReadonlySet<QuoteStatus> = new Set(["win", "loss", "expired"])

const EXPORT_ALLOWED: ReadonlySet<QuoteStatus> = new Set([
  "review",
  "sent",
  "win",
  "loss",
])

/** Customer-facing status copy (never dump raw enum keys). */
export const QUOTE_STATUS_META: Readonly<
  Record<QuoteStatus, { label: string; color: string }>
> = {
  draft: { label: "Draft", color: "#6B7280" },
  review: { label: "Review", color: "#DC2626" },
  sent: { label: "Sent", color: "#7C3AED" },
  win: { label: "Won", color: "#059669" },
  loss: { label: "Loss", color: "#9CA3AF" },
  expired: { label: "Expired", color: "#9CA3AF" },
}

export function quoteStatusLabel(status: QuoteStatus): string {
  return QUOTE_STATUS_META[status]?.label ?? status
}

/** Commercial body (lanes, charges, customer, currency, Incoterm) stays editable. */
export function isCommercialEditable(status: QuoteStatus): boolean {
  return !TERMINAL.has(status)
}

/** Export / destructive toolbar commands (PDF in 083, …). Includes review so a PDF can be attached before marking sent. */
export function canRunExportCommand(status: QuoteStatus): boolean {
  return EXPORT_ALLOWED.has(status)
}
