import { describe, expect, test } from "bun:test"

import {
  convertToQuoteCurrency,
  mergeBaseFxRates,
  tryConvertCurrency,
  tryGetFxRate,
} from "./fx"

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

describe("mergeBaseFxRates", () => {
  test("writes base row, keeps manual overrides, ignores invalid", () => {
    const current = { EUR: { USD: 1.2 } }
    const next = mergeBaseFxRates(current, "usd", {
      EUR: 0.9,
      GBP: 0.8,
      USD: 1,
      BAD: Number.NaN,
      NEG: -1,
    })
    expect(next).toEqual({ EUR: { USD: 1.2 }, USD: { EUR: 0.9, GBP: 0.8 } })
  })

  test("returns same reference when unchanged", () => {
    const current = { USD: { EUR: 0.9 } }
    expect(mergeBaseFxRates(current, "USD", { EUR: 0.9 })).toBe(current)
  })

  test("live base row feeds ONE MATH conversion for line → base", () => {
    const rates = mergeBaseFxRates({}, "USD", { EUR: 0.5 })
    const result = tryConvertCurrency(10, "EUR", "USD", rates)
    expect("converted" in result && result.converted).toBeCloseTo(20)
  })
})
