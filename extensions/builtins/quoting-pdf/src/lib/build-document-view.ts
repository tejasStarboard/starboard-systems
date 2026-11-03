import {
  emptyQuoteDocumentOrg,
  QUOTE_DOCUMENT_VIEW_VERSION,
  resolveSelectedManualRate,
  type LaneFormValues,
  type QuoteDocumentCharge,
  type QuoteDocumentLane,
  type QuoteDocumentOrg,
  type QuoteDocumentSection,
  type QuoteDocumentView,
  type QuoteFormValues,
  type SurchargeLine,
} from "@starboard/lib-contracts"
import {
  calculateManualRateTotals,
  excludedBucketsForIncoterm,
} from "@starboard/lib-pricing"

import { usageFromLane } from "./usage-from-lane"

export type BuildQuoteDocumentViewOptions = {
  org?: QuoteDocumentOrg
  customerName?: string
  /** Extra free-text notes appended after the derived ones. */
  notes?: string[]
}

const LEG_LABEL = {
  origin: "Origin charges",
  freight: "Freight charges",
  destination: "Destination charges",
} as const

function surchargeRow(
  line: SurchargeLine,
  leg: QuoteDocumentCharge["leg"],
  note?: string
): QuoteDocumentCharge {
  return {
    name: line.name.trim() || "Charge",
    leg,
    currencyCode: line.currencyCode,
    amount: line.sellAmount ?? line.buyAmount ?? line.rate,
    included: line.isIncludedInTotal,
    absorbed: !line.isVisible,
    ...(note ? { note } : {}),
  }
}

function cargoOf(lane: LaneFormValues): QuoteDocumentLane["cargo"] {
  const containers = lane.containers.map((line) => ({
    type: line.containerType,
    count: line.count,
    weightKg: line.weight,
  }))
  const fcl = lane.mode === "fcl"
  const weightKg = fcl
    ? containers.reduce((sum, line) => sum + (line.weightKg || 0), 0)
    : lane.weight
  const volumeCbm = fcl ? 0 : lane.volume
  const palletCount = fcl ? 0 : lane.palletCount
  const parts = fcl
    ? containers
        .filter((line) => line.count > 0)
        .map((line) => `${line.count} × ${line.type}`)
    : [
        palletCount > 0 ? `${palletCount} pallets` : "",
        volumeCbm > 0 ? `${volumeCbm} cbm` : "",
      ].filter(Boolean)
  if (weightKg > 0) parts.push(`${weightKg.toLocaleString("en-US")} kg`)
  return {
    summary: parts.join(" · "),
    containers: fcl ? containers : [],
    weightKg,
    volumeCbm,
    palletCount,
  }
}

/**
 * Quote form (+ org/customer context) → the stable `QuoteDocumentView`.
 * Totals come only from `@starboard/lib-pricing` (selected rate + globals +
 * Incoterm exclusions) — templates are display-only, no twin math.
 */
export function buildQuoteDocumentView(
  quote: QuoteFormValues,
  options: BuildQuoteDocumentViewOptions = {}
): QuoteDocumentView {
  const currencyCode = quote.currencyCode.trim().toUpperCase()
  const excludedBuckets = excludedBucketsForIncoterm({
    incoterm: quote.incoterm || null,
    role: quote.customerRole,
  })

  const lanes: QuoteDocumentLane[] = quote.lanes.map((lane, index) => {
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

    const byLeg: Record<keyof typeof LEG_LABEL, QuoteDocumentCharge[]> = {
      origin: [],
      freight: [],
      destination: [],
    }
    if (selected) {
      byLeg.freight.push({
        name: selected.label.trim() || "Base freight",
        leg: "freight",
        currencyCode,
        amount: selected.amount,
        included: true,
        absorbed: false,
      })
      for (const surcharge of selected.surcharges) {
        if (surcharge.isRemoved) continue
        const excluded =
          excludedBuckets.includes(surcharge.leg) &&
          surcharge.scopeOverride !== "include"
        byLeg[surcharge.leg].push(
          surchargeRow(
            surcharge,
            surcharge.leg,
            excluded ? "Excluded by Incoterm" : undefined
          )
        )
      }
    }
    const sections: QuoteDocumentSection[] = (
      Object.keys(LEG_LABEL) as Array<keyof typeof LEG_LABEL>
    )
      .filter((leg) => byLeg[leg].length > 0)
      .map((leg) => ({ leg, label: LEG_LABEL[leg], charges: byLeg[leg] }))

    return {
      index: index + 1,
      mode: lane.mode,
      origin: lane.origin,
      originVia: lane.originVia,
      destinationVia: lane.destinationVia,
      destination: lane.destination,
      pickup: lane.pickup.label.trim(),
      delivery: lane.delivery.label.trim(),
      cargo: cargoOf(lane),
      rateLabel: selected?.label.trim() || "No rate",
      sections,
      subtotal: totals.subtotal,
      markup: totals.markup,
      total: totals.total,
    }
  })

  const notes: string[] = []
  if (quote.incoterm) {
    notes.push(
      `Incoterm ${quote.incoterm} (${quote.customerRole})` +
        (excludedBuckets.length > 0
          ? ` — excludes ${excludedBuckets.join(", ")} charges`
          : "")
    )
  }
  if (quote.effectiveFrom || quote.expiryAt) {
    notes.push(
      `Valid ${quote.effectiveFrom || "-"} to ${quote.expiryAt || "-"}`
    )
  }
  if (quote.status === "draft") {
    notes.push("Draft — rates subject to confirmation.")
  }
  notes.push(...(options.notes ?? []))

  return {
    schemaVersion: QUOTE_DOCUMENT_VIEW_VERSION,
    org: options.org ?? emptyQuoteDocumentOrg(),
    quote: {
      id: quote.quoteId || quote.id,
      status: quote.status,
      // Blank stays blank: totals skip FX without a base, never claim USD.
      currencyCode,
      incoterm: quote.incoterm,
      customerRole: quote.customerRole,
      effectiveFrom: quote.effectiveFrom,
      expiryAt: quote.expiryAt,
    },
    customer: { name: options.customerName?.trim() ?? "" },
    lanes,
    globals: (quote.globalCharges ?? [])
      .filter((line) => !line.isRemoved)
      .map((line) => surchargeRow(line, "global")),
    excludedBuckets,
    totals: {
      currencyCode,
      subtotal: lanes.reduce((sum, lane) => sum + lane.subtotal, 0),
      markup: lanes.reduce((sum, lane) => sum + lane.markup, 0),
      grandTotal: lanes.reduce((sum, lane) => sum + lane.total, 0),
    },
    notes,
  }
}
