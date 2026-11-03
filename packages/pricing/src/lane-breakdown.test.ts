import { describe, expect, test } from "bun:test"

import {
  buildLaneUsageQuantities,
  computeManualLaneBreakdown,
  computeManualLaneTotals,
  type ManualLaneTotalsInput,
} from "./manual-totals"
import { roundMoney } from "./money"

const surcharge = (
  overrides: Partial<
    NonNullable<ManualLaneTotalsInput["lines"][number]["surcharges"]>[number]
  >
) => ({
  usageUnit: "flat" as const,
  currencyCode: "USD",
  isIncludedInTotal: true,
  isRemoved: false,
  isVisible: true,
  source: "carrier",
  leg: "origin",
  ...overrides,
})

/** Rebuilds the lane buy from row amounts; must equal ONE MATH totals. */
function rowBuy(input: ManualLaneTotalsInput) {
  const breakdown = computeManualLaneBreakdown(input)
  const lines = breakdown.lines.reduce(
    (sum, line) =>
      sum +
      line.base.reduce((inner, part) => inner + part.extended, 0) +
      line.surcharges.reduce((inner, row) => inner + row.buy, 0),
    0
  )
  const globals = breakdown.globals.reduce((sum, row) => sum + row.buy, 0)
  return roundMoney(lines + globals)
}

describe("computeManualLaneBreakdown (094)", () => {
  test("flat base: unit / % / FX / scope rows reconstruct the lane buy", () => {
    const input: ManualLaneTotalsInput = {
      lines: [
        {
          amount: 1000,
          baseMode: "flat",
          surcharges: [
            surcharge({ usageUnit: "container", rate: 10 }),
            surcharge({
              usageUnit: "percentage",
              ratePercentage: 10,
              leg: "freight",
            }),
            surcharge({ rate: 100, currencyCode: "EUR" }),
            surcharge({ rate: 75, leg: "destination" }),
          ],
        },
      ],
      markupType: "amount",
      markupValue: 0,
      usage: buildLaneUsageQuantities({ containerCount: 2 }),
      scope: { excluded_buckets: ["destination"] },
      globalCharges: [surcharge({ rate: 5, source: "global", leg: "freight" })],
      quoteCurrency: "USD",
      fxRates: { EUR: { USD: 1.1 } },
    }
    const breakdown = computeManualLaneBreakdown(input)
    const rows = breakdown.lines[0]!.surcharges
    expect(rows.map((r) => roundMoney(r.sell))).toEqual([20, 100, 110, 0])
    expect(rows[3]!.included).toBe(false)
    expect(breakdown.globals[0]).toMatchObject({ sell: 5, included: true })
    expect(rowBuy(input)).toBe(computeManualLaneTotals(input).buy)
  })

  test("per_eq base rolls per CT (amount × count) and matches totals", () => {
    const input: ManualLaneTotalsInput = {
      lines: [
        {
          amount: 0,
          baseMode: "per_eq",
          equipmentAmounts: [
            { containerType: "20GP", amount: 500, count: 2 },
            { containerType: "40HC", amount: 800, count: 1 },
          ],
          surcharges: [
            surcharge({ rate: 50 }),
            surcharge({ rate: 30, equipmentType: "40HC" }),
          ],
        },
      ],
      markupType: "amount",
      markupValue: 0,
      usage: buildLaneUsageQuantities({ containerCount: 3 }),
    }
    const [line] = computeManualLaneBreakdown(input).lines
    expect(line!.base.map((p) => [p.containerType, p.extended])).toEqual([
      ["20GP", 1000],
      ["40HC", 800],
    ])
    // 50 × 3 containers; 30 × 1 (40HC only)
    expect(line!.surcharges.map((r) => r.sell)).toEqual([150, 30])
    expect(rowBuy(input)).toBe(computeManualLaneTotals(input).buy)
    expect(rowBuy(input)).toBe(1000 + 800 + 150 + 30)
  })

  test("per_eq without equipment rows uses amount × container usage", () => {
    const input: ManualLaneTotalsInput = {
      lines: [{ amount: 400, baseMode: "per_eq" }],
      markupType: "amount",
      markupValue: 0,
      usage: buildLaneUsageQuantities({ containerCount: 3 }),
    }
    expect(computeManualLaneBreakdown(input).lines[0]!.base[0]!.extended).toBe(
      1200
    )
    expect(rowBuy(input)).toBe(computeManualLaneTotals(input).buy)
  })
})
