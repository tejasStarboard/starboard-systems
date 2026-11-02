import { describe, expect, test } from "bun:test"

import { convertToQuoteCurrency, tryConvertCurrency, tryGetFxRate } from "./fx"

describe("tryGetFxRate", () => {
  test("same currency is 1", () => {
    expect(tryGetFxRate("USD", "USD", {})).toBe(1)
  })

  test("direct and inverse", () => {
    expect(tryGetFxRate("EUR", "USD", { EUR: { USD: 1.1 } })).toBe(1.1)
    expect(tryGetFxRate("USD", "EUR", { EUR: { USD: 1.1 } })).toBeCloseTo(
      1 / 1.1
    )
  })

  test("missing is null", () => {
    expect(tryGetFxRate("EUR", "USD", {})).toBeNull()
  })
})

describe("tryConvertCurrency", () => {
  test("converts with rate", () => {
    const result = tryConvertCurrency(100, "EUR", "USD", { EUR: { USD: 1.1 } })
    expect(result).toMatchObject({ fxRate: 1.1 })
    if ("converted" in result) {
      expect(result.converted).toBeCloseTo(110)
    }
  })

  test("missing rate", () => {
    expect(tryConvertCurrency(100, "EUR", "USD", {})).toEqual({ missing: true })
  })
})

describe("convertToQuoteCurrency", () => {
  test("passthrough when currencies match", () => {
    expect(convertToQuoteCurrency(50, "USD", "USD", {})).toBe(50)
  })

  test("missing FX yields 0", () => {
    expect(convertToQuoteCurrency(50, "EUR", "USD", {})).toBe(0)
  })
})
