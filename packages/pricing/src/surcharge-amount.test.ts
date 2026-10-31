import { describe, expect, test } from "bun:test"

import amountCases from "../fixtures/surcharge-amount-cases.json"
import {
  calculateSurchargeAmount,
  type CalculateSurchargeAmountInput,
  type SurchargeUsageUnit,
} from "./surcharge-amount"

const cases = (
  amountCases as {
    cases: {
      id: string
      input: CalculateSurchargeAmountInput & { usageUnit: SurchargeUsageUnit }
      expected: {
        buy: number
        sell: number
        effectiveUsage: number | null
      }
    }[]
  }
).cases

describe("calculateSurchargeAmount — surcharge-amount-cases fixture", () => {
  for (const fixture of cases) {
    test(fixture.id, () => {
      const result = calculateSurchargeAmount(fixture.input)
      expect(result.buy).toBe(fixture.expected.buy)
      expect(result.sell).toBe(fixture.expected.sell)
      expect(result.effectiveUsage).toBe(fixture.expected.effectiveUsage)
    })
  }
})
