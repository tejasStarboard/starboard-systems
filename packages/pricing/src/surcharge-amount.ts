import { roundMoney } from "./money"
import { getEffectiveUsageAmount } from "./usage"

/** Lean usage vocabulary aligned with `@starboard/lib-contracts` usageUnit. */
export type SurchargeUsageUnit =
  | "flat"
  | "container"
  | "teu"
  | "cbm"
  | "kg"
  | "ton"
  | "wm"
  | "pallet"
  | "per_time"
  | "percentage"
  | "unknown"

const PER_UNIT = new Set<SurchargeUsageUnit>([
  "container",
  "teu",
  "cbm",
  "kg",
  "ton",
  "wm",
  "pallet",
  "per_time",
])

export type CalculateSurchargeAmountInput = {
  usageUnit: SurchargeUsageUnit
  rate?: number | null
  ratePercentage?: number | null
  rawUsage?: number | null
  freeUsage?: number | null
  minUsage?: number | null
  maxUsage?: number | null
  /** Lane-currency base freight for percentage rows (FX stub = identity). */
  baseFreightAmount?: number | null
}

export type SurchargeAmounts = {
  buy: number
  sell: number
  effectiveUsage: number | null
}

function normalizePercent(raw: number): number {
  return raw > 1 ? raw / 100 : raw
}

function finiteOrNull(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null
  }
  return value
}

/**
 * Compute native-currency buy/sell for one surcharge row.
 *
 * Lean port of starboard-2 `computeSurchargeRow` without tiered matrices,
 * dollar min/max/free charge clamps, or user amount overrides.
 * Sell mirrors buy (no sell-rate overrides in the rewrite contract yet).
 *
 * Rollup callers should gate with {@link isIncludedInTotal}; this helper only
 * prices the row.
 */
export function calculateSurchargeAmount(
  input: CalculateSurchargeAmountInput
): SurchargeAmounts {
  const rate = finiteOrNull(input.rate)
  const ratePct = finiteOrNull(input.ratePercentage)
  const rawUsage = finiteOrNull(input.rawUsage)
  const freeUsage = finiteOrNull(input.freeUsage)
  const minUsage = finiteOrNull(input.minUsage)
  const maxUsage = finiteOrNull(input.maxUsage)
  const baseFreight = finiteOrNull(input.baseFreightAmount) ?? 0

  if (input.usageUnit === "unknown") {
    return { buy: 0, sell: 0, effectiveUsage: null }
  }

  const usesPercentage =
    input.usageUnit === "percentage" || (ratePct != null && ratePct !== 0)

  const hasUsageClamp =
    freeUsage != null || minUsage != null || maxUsage != null

  // Flat / percentage: clamps use implicit qty 1 when raw is unset (legacy SB-4401).
  const usageForClamps =
    rawUsage ??
    (hasUsageClamp && (input.usageUnit === "flat" || usesPercentage) ? 1 : null)

  let effectiveUsage: number | null = null
  if (usageForClamps != null) {
    effectiveUsage = getEffectiveUsageAmount({
      usageAmount: usageForClamps,
      freeUsage,
      minUsage,
      maxUsage,
    })
  }

  let buy = 0
  if (usesPercentage && ratePct != null) {
    buy = baseFreight * normalizePercent(ratePct)
  } else if (input.usageUnit === "flat" || !PER_UNIT.has(input.usageUnit)) {
    if (rate != null) {
      buy = effectiveUsage != null ? rate * effectiveUsage : rate
    }
  } else if (rate != null && effectiveUsage != null) {
    buy = rate * effectiveUsage
  }

  const rounded = roundMoney(buy)
  return { buy: rounded, sell: rounded, effectiveUsage }
}
