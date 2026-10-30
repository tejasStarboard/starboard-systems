import { describe, expect, test } from "bun:test"

import { DEFAULT_PLAN, parsePlan } from "./plan.js"

describe("parsePlan", () => {
  test("accepts credit and enterprise", () => {
    expect(parsePlan("credit")).toBe("credit")
    expect(parsePlan("enterprise")).toBe("enterprise")
  })

  test("falls back to credit for missing or invalid values", () => {
    expect(parsePlan(undefined)).toBe(DEFAULT_PLAN)
    expect(parsePlan(null)).toBe("credit")
    expect(parsePlan("")).toBe("credit")
    expect(parsePlan("pro")).toBe("credit")
    expect(parsePlan(1)).toBe("credit")
  })
})
