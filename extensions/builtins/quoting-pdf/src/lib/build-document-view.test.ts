import { describe, expect, test } from "bun:test"

import {
  createManualRateLine,
  createSurchargeLine,
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
      amount: null, // dropped from totals by Incoterm (ONE MATH)
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

  test("row amounts follow ONE MATH: per_eq base, %, unit, FX, globals", () => {
    const quote = goldenFobShipperQuote()
    quote.incoterm = ""
    quote.exchangeRates = { EUR: { USD: 1.1 } }
    const line = (
      id: string,
      overrides: Partial<ReturnType<typeof createSurchargeLine>>
    ) =>
      createSurchargeLine({
        id,
        name: id,
        leg: "origin",
        usageUnit: "flat",
        currencyCode: "USD",
        source: "carrier",
        ...overrides,
      })
    const rate = createManualRateLine({
      id: "r",
      label: "Ocean",
      amount: 0,
      baseMode: "per_eq",
      equipmentAmounts: [
        { containerType: "20GP", amount: 500 },
        { containerType: "40HC", amount: 800 },
      ],
      surcharges: [
        line("thc", { usageUnit: "container", rate: 10 }),
        line("eur", { rate: 100, currencyCode: "EUR" }),
        line("baf", {
          leg: "freight",
          usageUnit: "percentage",
          ratePercentage: 10,
        }),
      ],
    })
    quote.lanes[0] = {
      ...quote.lanes[0]!,
      mode: "fcl",
      selectedRateId: "r",
      manualRates: [rate],
      containers: [
        { id: "a", containerType: "20GP", weight: 1, count: 2 },
        { id: "b", containerType: "40HC", weight: 1, count: 1 },
      ],
    }
    quote.globalCharges = [
      createSurchargeLine({
        id: "g",
        name: "Doc fee",
        usageUnit: "flat",
        rate: 25,
        currencyCode: "USD",
        source: "global",
      }),
    ]
    const view = buildQuoteDocumentView(quote)
    const lane = view.lanes[0]!
    const base = lane.sections
      .flatMap((s) => s.charges)
      .filter((c) => c.name.startsWith("Ocean"))
    expect(base.map((c) => [c.name, c.amount])).toEqual([
      ["Ocean - 2 × 20GP", 1000],
      ["Ocean - 1 × 40HC", 800],
    ])
    const rows = lane.sections.flatMap((s) => s.charges)
    const byName = (name: string) => rows.find((c) => c.name === name)!
    expect(byName("thc").amount).toBe(30) // 10 × 3 containers
    expect(byName("eur").amount).toBeCloseTo(330, 2) // (100 × 1.1) × 3 CTs
    expect(byName("eur")).toMatchObject({
      currencyCode: "USD",
      sourceCurrencyCode: "EUR",
    })
    expect(view.globals[0]!.amount).toBe(25)
    // Every displayed amount (+ globals) reconstructs the lane total.
    const sum =
      rows.reduce((acc, c) => acc + (c.amount ?? 0), 0) +
      view.globals.reduce((acc, c) => acc + (c.amount ?? 0), 0)
    expect(sum).toBeCloseTo(lane.total - lane.markup, 1)
  })
})
