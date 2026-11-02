import { convertToQuoteCurrency, type FxRates } from "./fx"
import { roundMoney } from "./money"
import {
  calculateSurchargeAmount,
  type SurchargeUsageUnit,
} from "./surcharge-amount"
import { isIncludedInTotal, type ScopeContext } from "./total-inclusion"

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
  /** Line sell total. Finite values replace the mirrored buy for this row. */
  sellAmount?: number | null
  /** Line currency; converted into quote currency when FX is supplied. */
  currencyCode?: string | null
  /**
   * Prod `equipment_type`. Null / empty / `default` → applies to every CT.
   * A concrete type scopes the line to that equipment only.
   */
  equipmentType?: string | null
}

export type ManualRateBaseMode = "flat" | "per_eq"

export type ManualEquipmentAmount = {
  containerType: string
  amount: number
  count: number
  /** Per-CT dial; null/undefined falls back to the lane dial (per unit). */
  markupType?: MarkupType | null
  markupValue?: number | null
}

export type ManualLaneTotalsInput = {
  lines: Array<{
    amount: number
    /** Defaults to a single flat amount. */
    baseMode?: ManualRateBaseMode
    /** When `per_eq` and non-empty, buy is the sum of amount × count. */
    equipmentAmounts?: ManualEquipmentAmount[]
    surcharges?: ManualSurchargeLineInput[]
  }>
  markupType: MarkupType
  markupValue: number
  /** Required for per-unit surcharge math; ignored when lines have no surcharges. */
  usage?: LaneUsageQuantities | null
  /** Bucket / incoterm scope for lane surcharge inclusion (sell / rollup_buy). */
  scope?: ScopeContext | null
  /**
   * Quote-level global charges (source `global`). Always scope-bucket-immune;
   * still respect inclusion / removed flags. % rows use sum of line amounts.
   */
  globalCharges?: ManualSurchargeLineInput[] | null
  /** Quote currency for FX conversion (starboard-2 display / quote currency). */
  quoteCurrency?: string | null
  /** Quote FX map. Missing pairs convert foreign lines to 0. */
  fxRates?: FxRates | null
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

/** True when the surcharge applies to `containerType` (null = Default / all). */
export function surchargeAppliesToEquipment(
  equipmentType: string | null | undefined,
  containerType: string
): boolean {
  const normalized = (equipmentType ?? "").trim()
  if (normalized.length === 0 || normalized.toLowerCase() === "default") {
    return true
  }
  return normalized === containerType
}

function convertAmounts(
  amounts: { buy: number; sell: number },
  lineCurrency: string | null | undefined,
  quoteCurrency: string | null | undefined,
  fxRates: FxRates | null | undefined
): { buy: number; sell: number } {
  return {
    buy: convertToQuoteCurrency(
      amounts.buy,
      lineCurrency,
      quoteCurrency,
      fxRates
    ),
    sell: convertToQuoteCurrency(
      amounts.sell,
      lineCurrency,
      quoteCurrency,
      fxRates
    ),
  }
}

function surchargeAmounts(
  surcharge: ManualSurchargeLineInput,
  baseFreightAmount: number,
  usage: LaneUsageQuantities | null | undefined,
  scope: ScopeContext | null | undefined,
  quoteCurrency: string | null | undefined,
  fxRates: FxRates | null | undefined
): { buy: number; sell: number } {
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
      "sell",
      scope
    )
  ) {
    return { buy: 0, sell: 0 }
  }

  const priced = calculateSurchargeAmount({
    usageUnit: surcharge.usageUnit,
    rate: surcharge.rate,
    ratePercentage: surcharge.ratePercentage,
    rawUsage: rawUsageForUnit(surcharge.usageUnit, usage),
    freeUsage: surcharge.freeUsage,
    minUsage: surcharge.minUsage,
    maxUsage: surcharge.maxUsage,
    baseFreightAmount,
    sellAmount: surcharge.sellAmount,
  })
  return convertAmounts(
    { buy: priced.buy, sell: priced.sell },
    surcharge.currencyCode,
    quoteCurrency,
    fxRates
  )
}

function dialMarkup(
  buy: number,
  markupType: MarkupType,
  markupValue: number
): number {
  const value = Number.isFinite(markupValue) ? markupValue : 0
  return roundMoney(markupType === "percent" ? (buy * value) / 100 : value)
}

function resolveDial(
  row: ManualEquipmentAmount | null | undefined,
  laneType: MarkupType,
  laneValue: number
): { markupType: MarkupType; markupValue: number } {
  const type = row?.markupType
  const value = row?.markupValue
  if (type === "amount" || type === "percent") {
    return {
      markupType: type,
      markupValue: value != null && Number.isFinite(value) ? value : 0,
    }
  }
  if (value != null && Number.isFinite(value)) {
    return { markupType: laneType, markupValue: value }
  }
  return { markupType: laneType, markupValue: laneValue }
}

function unitUsage(
  usage: LaneUsageQuantities | null | undefined
): LaneUsageQuantities {
  return {
    ...(usage ?? {}),
    container: 1,
    teu: 1,
  }
}

/**
 * starboard-2 FCL path: price **one container** of a type, apply that CT's
 * dial, then multiply by count (see `deriveFclRateTotals` + SB-5766).
 */
function equipmentLineAmounts(
  line: ManualLaneTotalsInput["lines"][number],
  usage: LaneUsageQuantities | null | undefined,
  scope: ScopeContext | null | undefined,
  laneMarkupType: MarkupType,
  laneMarkupValue: number,
  quoteCurrency: string | null | undefined,
  fxRates: FxRates | null | undefined
): { buy: number; sell: number; dial: number } {
  const equipment = line.equipmentAmounts ?? []
  const surcharges = line.surcharges ?? []
  const perUnitUsage = unitUsage(usage)

  return equipment.reduce(
    (sum, row) => {
      const count = Number.isFinite(row.count) ? row.count : 0
      if (count <= 0) {
        return sum
      }
      const unitBase = Number.isFinite(row.amount) ? row.amount : 0
      const applicable = surcharges.filter((surcharge) =>
        surchargeAppliesToEquipment(surcharge.equipmentType, row.containerType)
      )
      const surchargeTotal = applicable.reduce(
        (inner, surcharge) => {
          const amounts = surchargeAmounts(
            surcharge,
            unitBase,
            perUnitUsage,
            scope,
            quoteCurrency,
            fxRates
          )
          return {
            buy: inner.buy + amounts.buy,
            sell: inner.sell + amounts.sell,
          }
        },
        { buy: 0, sell: 0 }
      )
      const unitBuy = unitBase + surchargeTotal.buy
      const unitSellSeed = unitBase + surchargeTotal.sell
      const dial = resolveDial(row, laneMarkupType, laneMarkupValue)
      const unitDial = dialMarkup(unitBuy, dial.markupType, dial.markupValue)
      const unitUplift = unitSellSeed - unitBuy
      return {
        buy: sum.buy + unitBuy * count,
        sell: sum.sell + (unitSellSeed + unitDial) * count,
        dial: sum.dial + unitDial * count,
      }
    },
    { buy: 0, sell: 0, dial: 0 }
  )
}

function baseFreightBuy(
  line: ManualLaneTotalsInput["lines"][number],
  usage: LaneUsageQuantities | null | undefined
): number {
  if (line.baseMode === "per_eq") {
    const equipment = line.equipmentAmounts ?? []
    if (equipment.length > 0) {
      return equipment.reduce((sum, row) => {
        const amount = Number.isFinite(row.amount) ? row.amount : 0
        const count = Number.isFinite(row.count) ? row.count : 0
        return sum + amount * count
      }, 0)
    }
    const containers = usage?.container ?? 0
    const amount = Number.isFinite(line.amount) ? line.amount : 0
    return amount * containers
  }
  return Number.isFinite(line.amount) ? line.amount : 0
}

function lineAmounts(
  line: ManualLaneTotalsInput["lines"][number],
  usage: LaneUsageQuantities | null | undefined,
  scope: ScopeContext | null | undefined,
  quoteCurrency: string | null | undefined,
  fxRates: FxRates | null | undefined
): { buy: number; sell: number } {
  const base = baseFreightBuy(line, usage)
  const surcharges = line.surcharges ?? []
  if (surcharges.length === 0) {
    return { buy: base, sell: base }
  }
  const surchargeTotal = surcharges.reduce(
    (sum, row) => {
      const amounts = surchargeAmounts(
        row,
        base,
        usage,
        scope,
        quoteCurrency,
        fxRates
      )
      return { buy: sum.buy + amounts.buy, sell: sum.sell + amounts.sell }
    },
    { buy: 0, sell: 0 }
  )
  return {
    buy: base + surchargeTotal.buy,
    sell: base + surchargeTotal.sell,
  }
}

function linesBaseFreight(
  lines: ManualLaneTotalsInput["lines"],
  usage: LaneUsageQuantities | null | undefined
): number {
  return lines.reduce((sum, line) => sum + baseFreightBuy(line, usage), 0)
}

function usesPerCtPath(lines: ManualLaneTotalsInput["lines"]): boolean {
  return lines.some(
    (line) =>
      line.baseMode === "per_eq" && (line.equipmentAmounts?.length ?? 0) > 0
  )
}

/**
 * Sum manual rate lines as buy seed, apply amount/percent markup, derive sell.
 *
 * Multi-CT FCL (`per_eq` + `equipmentAmounts`): prices each CT like starboard-2
 * `deriveFclRateTotals` (one container, then × count) with per-CT dials and
 * `equipmentType` filtering. Flat / single-amount paths keep one lane dial on
 * the rolled buy.
 *
 * FX: line amounts in a foreign currency convert via `fxRates` into
 * `quoteCurrency` (missing rate → 0).
 */
export function computeManualLaneTotals(
  input: ManualLaneTotalsInput
): ManualLaneTotals {
  const scope = input.scope ?? null
  const quoteCurrency = input.quoteCurrency ?? null
  const fxRates = input.fxRates ?? null
  const perCt = usesPerCtPath(input.lines)

  let laneBuy = 0
  let laneSellSeed = 0

  if (perCt) {
    for (const line of input.lines) {
      if (
        line.baseMode === "per_eq" &&
        (line.equipmentAmounts?.length ?? 0) > 0
      ) {
        const amounts = equipmentLineAmounts(
          line,
          input.usage,
          scope,
          input.markupType,
          Number.isFinite(input.markupValue) ? input.markupValue : 0,
          quoteCurrency,
          fxRates
        )
        laneBuy += amounts.buy
        laneSellSeed += amounts.sell
      } else {
        const amounts = lineAmounts(
          line,
          input.usage,
          scope,
          quoteCurrency,
          fxRates
        )
        laneBuy += amounts.buy
        laneSellSeed += amounts.sell
      }
    }
  } else {
    for (const line of input.lines) {
      const amounts = lineAmounts(
        line,
        input.usage,
        scope,
        quoteCurrency,
        fxRates
      )
      laneBuy += amounts.buy
      laneSellSeed += amounts.sell
    }
  }

  const globals = input.globalCharges ?? []
  const baseFreight = linesBaseFreight(input.lines, input.usage)
  const globalAmounts =
    globals.length === 0
      ? { buy: 0, sell: 0 }
      : globals.reduce(
          (sum, row) => {
            const amounts = surchargeAmounts(
              { ...row, source: row.source ?? "global" },
              baseFreight,
              input.usage,
              scope,
              quoteCurrency,
              fxRates
            )
            return { buy: sum.buy + amounts.buy, sell: sum.sell + amounts.sell }
          },
          { buy: 0, sell: 0 }
        )

  const buy = roundMoney(laneBuy + globalAmounts.buy)
  const sellSeed = roundMoney(laneSellSeed + globalAmounts.sell)
  const rowUplift = roundMoney(sellSeed - buy)

  if (perCt) {
    const markup = roundMoney(rowUplift)
    return {
      buy,
      markup,
      sell: roundMoney(buy + markup),
    }
  }

  const markupValue = Number.isFinite(input.markupValue) ? input.markupValue : 0
  const dial = dialMarkup(buy, input.markupType, markupValue)
  const markup = roundMoney(rowUplift + dial)

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
