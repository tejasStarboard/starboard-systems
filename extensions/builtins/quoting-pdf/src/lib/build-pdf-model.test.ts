import { describe, expect, test } from "bun:test"

import {
  createManualRateLine,
  createSurchargeLine,
  emptyQuoteFormValues,
} from "@starboard/lib-contracts"
import {
  calculateManualRateTotals,
  excludedBucketsForIncoterm,
} from "@starboard/lib-pricing"

import { buildQuotePdfModel } from "./build-pdf-model"
import { renderQuotePdfPreview } from "./preview-pdf"
import { renderQuotePdf } from "./render-pdf"
import { usageFromLane } from "./usage-from-lane"

function goldenFobShipperQuote() {
  const quote = emptyQuoteFormValues({ id: "q-1", quoteId: "AB12CD" })
  quote.status = "sent"
  quote.currencyCode = "USD"
  quote.incoterm = "FOB"
  quote.customerRole = "shipper"
  quote.effectiveFrom = "2026-01-01"
  quote.expiryAt = "2026-02-01"
  const rate = createManualRateLine({
    id: "rate-1",
    label: "Ocean FCL",
    amount: 1000,
    baseMode: "flat",
    surcharges: [
      createSurchargeLine({
        id: "s-origin",
        name: "Origin THC",
        leg: "origin",
        usageUnit: "flat",
        rate: 100,
        currencyCode: "USD",
        source: "carrier",
      }),
      createSurchargeLine({
        id: "s-freight",
        name: "BAF",
        leg: "freight",
        usageUnit: "flat",
        rate: 50,
        currencyCode: "USD",
        source: "carrier",
      }),
      createSurchargeLine({
        id: "s-dest",
        name: "Dest THC",
        leg: "destination",
        usageUnit: "flat",
        rate: 75,
        currencyCode: "USD",
        source: "carrier",
      }),
    ],
  })
  quote.lanes[0] = {
    ...quote.lanes[0]!,
    origin: "CNSHA",
    destination: "USLAX",
    markupType: "amount",
    markupValue: 0,
    selectedRateId: rate.id,
    manualRates: [rate],
    containers: [
      {
        id: "c-1",
        containerType: "40HC",
        weight: 1000,
        count: 1,
      },
    ],
  }
  return quote
}

describe("buildQuotePdfModel (083)", () => {
  test("FOB shipper totals match ONE MATH (freight+dest excluded)", () => {
    const quote = goldenFobShipperQuote()
    const excluded = excludedBucketsForIncoterm({
      incoterm: quote.incoterm,
      role: quote.customerRole,
    })
    expect(excluded).toEqual(["freight", "destination"])

    const lane = quote.lanes[0]!
    const rate = lane.manualRates[0]!
    const expected = calculateManualRateTotals({
      lines: [
        {
          amount: rate.amount,
          baseMode: rate.baseMode,
          equipmentAmounts: [],
          surcharges: rate.surcharges,
        },
      ],
      markupType: "amount",
      markupValue: 0,
      usage: usageFromLane(lane),
      scope: { excluded_buckets: excluded },
      globalCharges: [],
    })
    // base 1000 + origin 100; freight 50 + dest 75 dropped
    expect(expected).toEqual({ subtotal: 1100, markup: 0, total: 1100 })

    const model = buildQuotePdfModel(quote)
    expect(model.excludedBuckets).toEqual(["freight", "destination"])
    expect(model.lanes[0]?.subtotal).toBe(expected.subtotal)
    expect(model.lanes[0]?.markup).toBe(expected.markup)
    expect(model.lanes[0]?.total).toBe(expected.total)
    expect(model.grandTotal).toBe(1100)
    expect(model.lanes[0]?.charges.find((c) => c.name === "BAF")?.note).toBe(
      "Excluded by Incoterm"
    )
  })

  test("blank base currency stays blank (no invented USD)", async () => {
    const quote = goldenFobShipperQuote()
    quote.currencyCode = ""
    const model = buildQuotePdfModel(quote)
    expect(model.currencyCode).toBe("")
    expect((await renderQuotePdf(model)).byteLength).toBeGreaterThan(100)
  })

  test("renderQuotePdf emits a PDF with matching grand total path", async () => {
    const model = buildQuotePdfModel(goldenFobShipperQuote())
    const bytes = await renderQuotePdf(model)
    expect(bytes.byteLength).toBeGreaterThan(100)
    const header = new TextDecoder().decode(bytes.slice(0, 5))
    expect(header).toBe("%PDF-")
  })
})

describe("renderQuotePdfPreview (092)", () => {
  test("renders unsaved draft form values with the same model (no export gate)", async () => {
    const quote = goldenFobShipperQuote()
    quote.status = "draft"
    const bytes = await renderQuotePdfPreview(quote)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-")
    expect(buildQuotePdfModel(quote).grandTotal).toBe(1100)
  })
})
