import { describe, expect, test } from "bun:test"

import globalScopeFixtures from "../fixtures/global-scope-totals.json"
import manualRateFixtures from "../fixtures/manual-rate-totals.json"
import {
  buildLaneUsageQuantities,
  calculateManualRateTotals,
  computeManualLaneTotals,
  type ManualLaneTotalsInput,
  type MarkupType,
} from "./manual-totals"
import { roundMoney } from "./money"
import { deriveExcludedBuckets } from "./scope"

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

describe("computeManualLaneTotals — surcharges", () => {
  const usage = buildLaneUsageQuantities({
    containerCount: 2,
    weightKg: 1000,
    volumeCbm: 5,
    palletCount: 3,
  })

  test("adds flat included surcharge", () => {
    const totals = computeManualLaneTotals({
      lines: [
        {
          amount: 1000,
          surcharges: [
            {
              usageUnit: "flat",
              rate: 50,
              source: "manual",
              isIncludedInTotal: true,
              leg: "origin",
            },
          ],
        },
      ],
      markupType: "amount",
      markupValue: 0,
      usage,
    })
    expect(totals).toEqual({ buy: 1050, markup: 0, sell: 1050 })
  })

  test("skips excluded / removed surcharges", () => {
    const totals = computeManualLaneTotals({
      lines: [
        {
          amount: 1000,
          surcharges: [
            {
              usageUnit: "flat",
              rate: 50,
              source: "manual",
              isIncludedInTotal: false,
              leg: "freight",
            },
            {
              usageUnit: "flat",
              rate: 75,
              source: "carrier",
              isRemoved: true,
              leg: "destination",
            },
          ],
        },
      ],
      markupType: "amount",
      markupValue: 0,
      usage,
    })
    expect(totals.buy).toBe(1000)
  })

  test("prices per-container and percentage of base freight", () => {
    const totals = computeManualLaneTotals({
      lines: [
        {
          amount: 1000,
          surcharges: [
            {
              usageUnit: "container",
              rate: 25,
              source: "carrier",
              isIncludedInTotal: true,
              leg: "freight",
            },
            {
              usageUnit: "percentage",
              ratePercentage: 10,
              source: "carrier",
              isIncludedInTotal: true,
              leg: "freight",
            },
          ],
        },
      ],
      markupType: "percent",
      markupValue: 10,
      usage,
    })
    // base 1000 + 2*25 + 10%*1000 = 1150; markup 115
    expect(totals).toEqual({ buy: 1150, markup: 115, sell: 1265 })
  })

  test("unknown usage unit contributes 0", () => {
    const totals = computeManualLaneTotals({
      lines: [
        {
          amount: 500,
          surcharges: [
            {
              usageUnit: "unknown",
              rate: 999,
              source: "carrier",
              isIncludedInTotal: true,
              leg: "origin",
            },
          ],
        },
      ],
      markupType: "amount",
      markupValue: 0,
      usage,
    })
    expect(totals.buy).toBe(500)
  })
})

describe("buildLaneUsageQuantities", () => {
  test("derives ton and wm from weight/volume", () => {
    expect(
      buildLaneUsageQuantities({
        containerCount: 2,
        weightKg: 2000,
        volumeCbm: 1,
        palletCount: 4,
      })
    ).toEqual({
      container: 2,
      teu: 2,
      cbm: 1,
      kg: 2000,
      ton: 2,
      wm: 2,
      pallet: 4,
      per_time: 1,
    })
  })
})

describe("deriveExcludedBuckets", () => {
  test("port-to-port excludes origin and destination", () => {
    expect(
      deriveExcludedBuckets({ hasPickupDoor: false, hasDeliveryDoor: false })
    ).toEqual(["origin", "destination"])
  })

  test("door-to-door excludes nothing", () => {
    expect(
      deriveExcludedBuckets({ hasPickupDoor: true, hasDeliveryDoor: true })
    ).toEqual([])
  })

  test("door pickup only excludes destination", () => {
    expect(
      deriveExcludedBuckets({ hasPickupDoor: true, hasDeliveryDoor: false })
    ).toEqual(["destination"])
  })
})

type GlobalScopeCase = {
  id: string
  input: ManualLaneTotalsInput
  expected: { buy: number; markup: number; sell: number }
}

const globalScopeCases = (globalScopeFixtures as { cases: GlobalScopeCase[] })
  .cases

describe("computeManualLaneTotals — global + scope fixtures", () => {
  for (const fixture of globalScopeCases) {
    test(fixture.id, () => {
      expect(computeManualLaneTotals(fixture.input)).toEqual(fixture.expected)
    })
  }
})
