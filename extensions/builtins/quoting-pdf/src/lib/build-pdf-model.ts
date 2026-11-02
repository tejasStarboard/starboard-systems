import {
  resolveSelectedManualRate,
  type QuoteFormValues,
  type SurchargeLine,
} from "@starboard/lib-contracts"
import {
  calculateManualRateTotals,
  excludedBucketsForIncoterm,
  type ScopeBucket,
} from "@starboard/lib-pricing"

import { usageFromLane } from "./usage-from-lane"

export type PdfChargeRow = {
  name: string
  leg: string
  amount: number | null
  included: boolean
  absorbed: boolean
  note?: string
}

export type PdfLaneSection = {
  index: number
  origin: string
  destination: string
  rateLabel: string
  charges: PdfChargeRow[]
  subtotal: number
  markup: number
  total: number
}

export type QuotePdfModel = {
  quoteId: string
  status: string
  currencyCode: string
  effectiveFrom: string
  expiryAt: string
  incoterm: string
  customerRole: string
  excludedBuckets: ScopeBucket[]
  globals: PdfChargeRow[]
  lanes: PdfLaneSection[]
  /** Sum of per-lane sell totals (ONE MATH per lane). */
  grandTotal: number
}

function chargeRow(line: SurchargeLine, note?: string): PdfChargeRow {
  return {
    name: line.name.trim() || "Charge",
    leg: line.leg,
    amount: line.sellAmount ?? line.buyAmount ?? line.rate,
    included: line.isIncludedInTotal,
    absorbed: !line.isVisible,
    note,
  }
}

/**
 * Lean QV2-shaped PDF model. Totals come only from `@starboard/lib-pricing`
 * (selected rate + globals + Incoterm exclusions) — no twin math.
 */
export function buildQuotePdfModel(quote: QuoteFormValues): QuotePdfModel {
  const excludedBuckets = excludedBucketsForIncoterm({
    incoterm: quote.incoterm || null,
    role: quote.customerRole,
  })

  const lanes: PdfLaneSection[] = quote.lanes.map((lane, index) => {
    const selected = resolveSelectedManualRate(
      lane.manualRates,
      lane.selectedRateId
    )
    const equipmentAmounts = (selected?.equipmentAmounts ?? []).map((row) => ({
      ...row,
      count:
        lane.containers.find(
          (container) => container.containerType === row.containerType
        )?.count ?? 0,
    }))
    const totals = calculateManualRateTotals({
      lines: selected
        ? [
            {
              amount: selected.amount,
              baseMode: selected.baseMode,
              equipmentAmounts,
              surcharges: selected.surcharges,
            },
          ]
        : [],
      markupType: lane.markupType,
      markupValue: Number(lane.markupValue) || 0,
      usage: usageFromLane(lane),
      scope: { excluded_buckets: excludedBuckets },
      globalCharges: index === 0 ? (quote.globalCharges ?? []) : [],
      quoteCurrency: quote.currencyCode || null,
      fxRates: quote.exchangeRates ?? {},
    })

    const charges: PdfChargeRow[] = []
    if (selected) {
      charges.push({
        name: selected.label.trim() || "Base freight",
        leg: "freight",
        amount: selected.amount,
        included: true,
        absorbed: false,
      })
      for (const surcharge of selected.surcharges) {
        const excluded =
          excludedBuckets.includes(surcharge.leg) &&
          surcharge.scopeOverride !== "include"
        charges.push(
          chargeRow(surcharge, excluded ? "Excluded by Incoterm" : undefined)
        )
      }
    }

    return {
      index: index + 1,
      origin: lane.origin,
      destination: lane.destination,
      rateLabel: selected?.label.trim() || "No rate",
      charges,
      subtotal: totals.subtotal,
      markup: totals.markup,
      total: totals.total,
    }
  })

  // Globals are rolled into lane 0 totals only (matches editor: globals once).
  // For display, list them separately under the document.
  const globals = (quote.globalCharges ?? []).map((line) => chargeRow(line))

  // Grand total: recompute each lane without double-counting globals, then
  // add one globals-inclusive pass for lane 0... Simpler: sum lane totals
  // where only the first lane includes globals (as built above).
  const grandTotal = lanes.reduce((sum, lane) => sum + lane.total, 0)

  return {
    quoteId: quote.quoteId || quote.id,
    status: quote.status,
    currencyCode: quote.currencyCode || "USD",
    effectiveFrom: quote.effectiveFrom,
    expiryAt: quote.expiryAt,
    incoterm: quote.incoterm || "-",
    customerRole: quote.customerRole,
    excludedBuckets,
    globals,
    lanes,
    grandTotal,
  }
}
