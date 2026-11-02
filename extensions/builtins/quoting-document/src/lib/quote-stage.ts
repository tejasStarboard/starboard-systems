import type { QuoteStatus } from "@starboard/lib-contracts"

const TERMINAL: ReadonlySet<QuoteStatus> = new Set(["win", "loss", "expired"])

const EXPORT_ALLOWED: ReadonlySet<QuoteStatus> = new Set([
  "review",
  "sent",
  "win",
  "loss",
])

/** Commercial body (lanes, charges, customer, currency, Incoterm) stays editable. */
export function isCommercialEditable(status: QuoteStatus): boolean {
  return !TERMINAL.has(status)
}

/** Export / destructive toolbar commands (PDF in 083, …). Includes review so a PDF can be attached before marking sent. */
export function canRunExportCommand(status: QuoteStatus): boolean {
  return EXPORT_ALLOWED.has(status)
}
