import { describe, expect, test } from "bun:test"

import {
  createManualRateLine,
  createSurchargeLine,
  emptyQuoteFormValues,
} from "@starboard/lib-contracts"
import { buildQuotePdfModel } from "@starboard/ext-quoting-pdf/model"

import { renderQuoteEmailPreview } from "./server"

/** Same golden FOB/shipper fixture as the 083 PDF test (ONE MATH = 1100). */
function goldenFobShipperQuote() {
  const quote = emptyQuoteFormValues({ id: "q-1", quoteId: "AB12CD" })
  quote.status = "draft"
  quote.currencyCode = "USD"
  quote.incoterm = "FOB"
  quote.customerRole = "shipper"
  quote.effectiveFrom = "2026-01-01"
  quote.expiryAt = "2026-02-01"
  const line = (
    id: string,
    name: string,
    leg: "origin" | "freight" | "destination",
    rate: number
  ) =>
    createSurchargeLine({
      id,
      name,
      leg,
      usageUnit: "flat",
      rate,
      currencyCode: "USD",
      source: "carrier",
    })
  const rate = createManualRateLine({
    id: "rate-1",
    label: "Ocean FCL",
    amount: 1000,
    baseMode: "flat",
    surcharges: [
      line("s-origin", "Origin THC", "origin", 100),
      line("s-freight", "BAF", "freight", 50),
      line("s-dest", "Dest THC", "destination", 75),
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
    containers: [{ id: "c-1", containerType: "40HC", weight: 1000, count: 1 }],
  }
  return quote
}

describe("renderQuoteEmailPreview (092)", () => {
  test("HTML totals match the 083 model (Incoterm exclusions honored)", async () => {
    const quote = goldenFobShipperQuote()
    const model = buildQuotePdfModel(quote)
    expect(model.grandTotal).toBe(1100)

    const { subject, html } = await renderQuoteEmailPreview({
      quote,
      customerName: "Acme Ltd",
    })
    expect(subject).toBe("Quote AB12CD · CNSHA → USLAX")
    expect(html).toContain("Hi Acme Ltd,")
    expect(html).toContain("CNSHA")
    expect(html).toContain("Grand total: ")
    expect(html).toContain("USD 1100.00")
    expect(html).toContain("Excluded by Incoterm")
    expect(html).not.toContain("USD 1225.00")
  })
})
