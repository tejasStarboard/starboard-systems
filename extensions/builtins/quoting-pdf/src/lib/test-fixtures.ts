import {
  createManualRateLine,
  createSurchargeLine,
  emptyQuoteFormValues,
} from "@starboard/lib-contracts"

/** Golden FOB/shipper quote: ONE MATH total = 1100 (freight + dest excluded). */
export function goldenFobShipperQuote() {
  const quote = emptyQuoteFormValues({ id: "q-1", quoteId: "AB12CD" })
  quote.status = "sent"
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
