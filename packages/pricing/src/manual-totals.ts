import { roundMoney } from "./money"
import {
  calculateSurchargeAmount,
  type SurchargeUsageUnit,
} from "./surcharge-amount"
import { isIncludedInTotal } from "./total-inclusion"

export type MarkupType = "amount" | "percent"

/** Lane cargo quantities for unit-priced surcharge rows. */
export type LaneUsageQuantities = {
  container?: number | null
  teu?: number | null
  cbm?: number | null
  kg?: number | null
  ton?: number | null
  wm?: number | null
  pallet?: number | null
  per_time?: number | null
}

/** CamelCase surcharge flags/rates for lane rollup (contracts shape). */
export type ManualSurchargeLineInput = {
  usageUnit: SurchargeUsageUnit
  rate?: number | null
  ratePercentage?: number | null
  freeUsage?: number | null
  minUsage?: number | null
  maxUsage?: number | null
  isIncludedInTotal?: boolean | null
  isRemoved?: boolean | null
  isVisible?: boolean | null
  leg?: string | null
  scopeOverride?: "include" | "exclude" | null
  source?: string | null
}

export type ManualLaneTotalsInput = {
  lines: Array<{
    amount: number
    surcharges?: ManualSurchargeLineInput[]
  }>
  markupType: MarkupType
  markupValue: number
  /** Required for per-unit surcharge math; ignored when lines have no surcharges. */
  usage?: LaneUsageQuantities | null
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
 * Build usage quantities from lane cargo scalars.
 * Lean TEU ≈ container count (no equipment TEU table yet).
 */
export function buildLaneUsageQuantities(input: {
  containerCount?: number | null
  weightKg?: number | null
  volumeCbm?: number | null
  palletCount?: number | null
}): LaneUsageQuantities {
  const containers = finiteOrZero(input.containerCount)
  const kg = finiteOrZero(input.weightKg)
  const cbm = finiteOrZero(input.volumeCbm)
  const ton = kg / 1000
  return {
    container: containers,
    teu: containers,
    cbm,
    kg,
    ton,
    wm: Math.max(cbm, ton),
    pallet: finiteOrZero(input.palletCount),
    per_time: 1,
  }
}

function finiteOrZero(value: number | null | undefined): number {
  return value != null && Number.isFinite(value) ? value : 0
}

function rawUsageForUnit(
  unit: SurchargeUsageUnit,
  usage: LaneUsageQuantities | null | undefined
): number | null {
  if (usage == null) {
    return null
  }
  switch (unit) {
    case "container":
      return usage.container ?? null
    case "teu":
      return usage.teu ?? null
    case "cbm":
      return usage.cbm ?? null
    case "kg":
      return usage.kg ?? null
    case "ton":
      return usage.ton ?? null
    case "wm":
      return usage.wm ?? null
    case "pallet":
      return usage.pallet ?? null
    case "per_time":
      return usage.per_time ?? null
    default:
      return null
  }
}

function surchargeBuy(
  surcharge: ManualSurchargeLineInput,
  baseFreightAmount: number,
  usage: LaneUsageQuantities | null | undefined
): number {
  if (
    !isIncludedInTotal(
      {
        is_removed: surcharge.isRemoved,
        is_visible: surcharge.isVisible,
        is_included_in_total: surcharge.isIncludedInTotal,
        leg: surcharge.leg,
        scope_override: surcharge.scopeOverride,
        source: surcharge.source,
      },
      {},
      "sell"
    )
  ) {
    return 0
  }

  return calculateSurchargeAmount({
    usageUnit: surcharge.usageUnit,
    rate: surcharge.rate,
    ratePercentage: surcharge.ratePercentage,
    rawUsage: rawUsageForUnit(surcharge.usageUnit, usage),
    freeUsage: surcharge.freeUsage,
    minUsage: surcharge.minUsage,
    maxUsage: surcharge.maxUsage,
    baseFreightAmount,
  }).buy
}

function lineBuy(
  line: ManualLaneTotalsInput["lines"][number],
  usage: LaneUsageQuantities | null | undefined
): number {
  const base = Number.isFinite(line.amount) ? line.amount : 0
  const surcharges = line.surcharges ?? []
  if (surcharges.length === 0) {
    return base
  }
  const surchargeTotal = surcharges.reduce(
    (sum, row) => sum + surchargeBuy(row, base, usage),
    0
  )
  return base + surchargeTotal
}

/**
 * Sum manual rate lines as buy seed, apply amount/percent markup, derive sell.
 * When lines carry surcharges, included rows are priced via
 * {@link calculateSurchargeAmount} using {@link ManualLaneTotalsInput.usage}.
 * Non-finite line amounts and markup values are treated as 0. Outputs are rounded.
 */
export function computeManualLaneTotals(
  input: ManualLaneTotalsInput
): ManualLaneTotals {
  const buy = roundMoney(
    input.lines.reduce((sum, line) => sum + lineBuy(line, input.usage), 0)
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
