import { describe, expect, test } from "bun:test"

import manualRateFixtures from "../fixtures/manual-rate-totals.json"
import {
  calculateManualRateTotals,
  computeManualLaneTotals,
  type MarkupType,
} from "./manual-totals"
import { roundMoney } from "./money"

type ManualCase = {
  id: string
  input: {
    lines: Array<{ amount: unknown }>
    markupType: MarkupType
    markupValue: unknown
  }
  expected: { buy: number; markup: number; sell: number }
}

const cases = (manualRateFixtures as { cases: ManualCase[] }).cases

describe("roundMoney", () => {
  test("rounds half-up to 2 decimals", () => {
    expect(roundMoney(1.005)).toBe(1.01)
    expect(roundMoney(1.004)).toBe(1)
    expect(roundMoney(Number.NaN)).toBe(0)
  })
})

describe("computeManualLaneTotals — golden fixtures", () => {
  for (const fixture of cases) {
    test(fixture.id, () => {
      const lines = fixture.input.lines.map((line) => ({
        amount: typeof line.amount === "number" ? line.amount : Number.NaN,
      }))
      const markupValue =
        typeof fixture.input.markupValue === "number"
          ? fixture.input.markupValue
          : Number.NaN

      const totals = computeManualLaneTotals({
        lines,
        markupType: fixture.input.markupType,
        markupValue,
      })
      expect(totals).toEqual(fixture.expected)

      const alias = calculateManualRateTotals({
        lines,
        markupType: fixture.input.markupType,
        markupValue,
      })
      expect(alias).toEqual({
        subtotal: fixture.expected.buy,
        markup: fixture.expected.markup,
        total: fixture.expected.sell,
      })
    })
  }
})
