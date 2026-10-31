import { describe, expect, test } from "bun:test"
import type { Rate } from "@starboard/lib-contracts"

import {
  catalogRateToManualLine,
  parseSpotSearchResult,
  spotOfferToManualLine,
} from "./apply-rate-to-lane"

const catalogRate: Rate = {
  id: "rate-1",
  organizationId: "org-1",
  origin: "SGSIN",
  destination: "NLRTM",
  customerId: null,
  mode: "fcl",
  carrier: "MAERSK",
  label: "Ocean freight",
  currencyCode: "USD",
  amount: 1500,
  validFrom: "2026-01-01",
  validTo: "2026-12-31",
  source: "manual",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("catalogRateToManualLine", () => {
  test("copies label and amount with a new id", () => {
    const line = catalogRateToManualLine(catalogRate)
    expect(line.label).toBe("Ocean freight")
    expect(line.amount).toBe(1500)
    expect(line.id).not.toBe(catalogRate.id)
    expect(line.id.length).toBeGreaterThan(0)
  })
})

describe("spotOfferToManualLine", () => {
  test("includes carrier in label when present", () => {
    const line = spotOfferToManualLine({
      label: "Fake spot SGSIN-NLRTM",
      currencyCode: "USD",
      amount: 1234.56,
      carrier: "FAKE",
    })
    expect(line.label).toBe("Fake spot SGSIN-NLRTM (FAKE)")
    expect(line.amount).toBe(1234.56)
  })

  test("uses plain label when carrier missing", () => {
    const line = spotOfferToManualLine({
      label: "Spot offer",
      currencyCode: "EUR",
      amount: 900,
    })
    expect(line.label).toBe("Spot offer")
    expect(line.amount).toBe(900)
  })
})

describe("parseSpotSearchResult", () => {
  test("returns offers for completed workflow with rates", () => {
    const parsed = parseSpotSearchResult({
      status: "completed",
      rates: [
        {
          origin: "SGSIN",
          destination: "NLRTM",
          carrier: "FAKE",
          label: "Fake spot SGSIN-NLRTM",
          currencyCode: "USD",
          amount: 1234.56,
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
          source: "spot",
          mode: "fcl",
        },
      ],
      error: null,
    })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.rates).toHaveLength(1)
      expect(parsed.rates[0]?.amount).toBe(1234.56)
    }
  })

  test("surfaces workflow error message", () => {
    const parsed = parseSpotSearchResult({
      status: "error",
      rates: [],
      error: {
        code: "missing_credentials",
        message: "Maersk credentials are required for this organization",
      },
    })
    expect(parsed).toEqual({
      ok: false,
      error: "Maersk credentials are required for this organization",
    })
  })

  test("rejects empty rates", () => {
    expect(
      parseSpotSearchResult({ status: "completed", rates: [], error: null })
    ).toEqual({
      ok: false,
      error: "No offers returned from spot search",
    })
  })

  test("rejects null or invalid result", () => {
    expect(parseSpotSearchResult(null)).toEqual({
      ok: false,
      error: "No offers returned from spot search",
    })
    expect(parseSpotSearchResult({ status: "completed" })).toEqual({
      ok: false,
      error: "No offers returned from spot search",
    })
  })
})
