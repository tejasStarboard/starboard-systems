import { describe, expect, test } from "bun:test"

import minMechanicsCases from "../fixtures/surcharge-min-mechanics.json"
import { getEffectiveUsageAmount } from "./usage"

const cases = (
  minMechanicsCases as {
    cases: {
      id: string
      input: {
        rawUsage: number
        freeUsage: number
        minUsage: number
        maxUsage: number
        rate: number
      }
      expected: { effectiveUsage: number; bill: number }
    }[]
  }
).cases

describe("getEffectiveUsageAmount — surcharge-min-mechanics fixture", () => {
  for (const fixture of cases) {
    test(fixture.id, () => {
      const effective = getEffectiveUsageAmount({
        usageAmount: fixture.input.rawUsage,
        freeUsage: fixture.input.freeUsage,
        minUsage: fixture.input.minUsage,
        maxUsage: fixture.input.maxUsage,
      })
      expect(effective).toBe(fixture.expected.effectiveUsage)
      expect(effective * fixture.input.rate).toBe(fixture.expected.bill)
    })
  }
})
