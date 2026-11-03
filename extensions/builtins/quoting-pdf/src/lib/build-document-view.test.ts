import { describe, expect, test } from "bun:test"

import {
  quoteDocumentViewSchema,
  resolveQuoteDocumentOrgContext,
} from "@starboard/lib-contracts"
import {
  calculateManualRateTotals,
  excludedBucketsForIncoterm,
} from "@starboard/lib-pricing"

import { buildQuoteDocumentView } from "./build-document-view"
import { goldenFobShipperQuote } from "./test-fixtures"
import { usageFromLane } from "./usage-from-lane"

describe("buildQuoteDocumentView (094)", () => {
  test("FOB shipper totals match ONE MATH (freight+dest excluded)", () => {
    const quote = goldenFobShipperQuote()
    const excluded = excludedBucketsForIncoterm({
      incoterm: quote.incoterm,
      role: quote.customerRole,
    })
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
    expect(expected).toEqual({ subtotal: 1100, markup: 0, total: 1100 })

    const view = buildQuoteDocumentView(quote, { customerName: " Acme " })
    expect(view.excludedBuckets).toEqual(["freight", "destination"])
    expect(view.lanes[0]?.total).toBe(expected.total)
    expect(view.totals).toMatchObject({ grandTotal: 1100, subtotal: 1100 })
    expect(view.customer.name).toBe("Acme")
    expect(view.quote).toMatchObject({ id: "AB12CD", currencyCode: "USD" })
    expect(view.lanes[0]?.cargo.summary).toBe("1 × 40HC · 1,000 kg")
    expect(view.notes.join("\n")).toContain("Incoterm FOB (shipper)")
  })

  test("sections group O/F/D with line currency and Incoterm notes", () => {
    const lane = buildQuoteDocumentView(goldenFobShipperQuote()).lanes[0]!
    expect(lane.sections.map((s) => s.leg)).toEqual([
      "origin",
      "freight",
      "destination",
    ])
    const freight = lane.sections.find((s) => s.leg === "freight")!
    expect(freight.charges.map((c) => c.name)).toEqual(["Ocean FCL", "BAF"])
    expect(freight.charges[1]).toMatchObject({
      currencyCode: "USD",
      amount: 50,
      note: "Excluded by Incoterm",
    })
  })

  test("output validates against the stable schema (incl. org branding)", () => {
    const { org } = resolveQuoteDocumentOrgContext({
      name: "Acme Freight",
      logo: "https://cdn.example.com/l.png",
    })
    const view = buildQuoteDocumentView(goldenFobShipperQuote(), { org })
    expect(quoteDocumentViewSchema.safeParse(view).success).toBe(true)
    expect(view.org.name).toBe("Acme Freight")
  })

  test("blank base currency stays blank (no invented USD)", () => {
    const quote = goldenFobShipperQuote()
    quote.currencyCode = ""
    const view = buildQuoteDocumentView(quote)
    expect(view.quote.currencyCode).toBe("")
    expect(view.totals.currencyCode).toBe("")
  })
})
