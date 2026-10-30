import { roundMoney } from "./money"

export type MarkupType = "amount" | "percent"

export type ManualLaneTotalsInput = {
  lines: Array<{ amount: number }>
  markupType: MarkupType
  markupValue: number
}

/** Canonical ONE MATH lane totals: sell = buy + markup. */
export type ManualLaneTotals = {
  buy: number
  markup: number
  sell: number
}

/** UI-facing alias of {@link ManualLaneTotals}. */
export type ManualRateTotals = {
  subtotal: number
  markup: number
  total: number
}

/**
 * Sum manual rate lines as buy seed, apply amount/percent markup, derive sell.
 * Non-finite line amounts and markup values are treated as 0. Outputs are rounded.
 */
export function computeManualLaneTotals(
  input: ManualLaneTotalsInput
): ManualLaneTotals {
  const buy = roundMoney(
    input.lines.reduce(
      (sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0),
      0
    )
  )
  const markupValue = Number.isFinite(input.markupValue) ? input.markupValue : 0
  const markup = roundMoney(
    input.markupType === "percent" ? (buy * markupValue) / 100 : markupValue
  )

  return {
    buy,
    markup,
    sell: roundMoney(buy + markup),
  }
}

/** Alias for quote UI: subtotal/markup/total ↔ buy/markup/sell. */
export function calculateManualRateTotals(
  input: ManualLaneTotalsInput
): ManualRateTotals {
  const { buy, markup, sell } = computeManualLaneTotals(input)
  return { subtotal: buy, markup, total: sell }
}
