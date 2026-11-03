import { describe, expect, test } from "bun:test"

import {
  isCargoValid,
  nextStep,
  previousStep,
  stepBlockedReason,
} from "./quote-builder-steps"
import { createContainerLine, emptyLaneFormValues } from "./quotes.schema"

function fclLane(overrides?: Record<string, unknown>) {
  return {
    ...emptyLaneFormValues("fcl"),
    containers: [createContainerLine({ containerType: "40HC", count: 1 })],
    ...overrides,
  }
}

describe("quote builder steps (089)", () => {
  test("orders Basics → Route → Cargo → Rates → Build", () => {
    expect(nextStep("basics")).toBe("route")
    expect(nextStep("route")).toBe("cargo")
    expect(nextStep("cargo")).toBe("rates")
    expect(nextStep("rates")).toBe("build")
    expect(nextStep("build")).toBeNull()
    expect(previousStep("basics")).toBeNull()
    expect(previousStep("route")).toBe("basics")
  })

  test("Basics and Route are always open", () => {
    const lane = emptyLaneFormValues("fcl")
    expect(stepBlockedReason("basics", lane)).toBeNull()
    expect(stepBlockedReason("route", lane)).toBeNull()
  })

  test("ports gate Cargo and everything after", () => {
    const lane = fclLane()
    expect(stepBlockedReason("cargo", lane)).not.toBeNull()
    expect(stepBlockedReason("rates", lane)).not.toBeNull()
    const ready = { ...lane, origin: "NLRTM", destination: "USNYC" }
    expect(stepBlockedReason("cargo", ready)).toBeNull()
  })

  test("valid cargo gates Rates and Build", () => {
    const ports = { origin: "NLRTM", destination: "USNYC" }
    const empty = fclLane({
      ...ports,
      containers: [createContainerLine({ containerType: "", count: 1 })],
    })
    expect(stepBlockedReason("rates", empty)).toBe("Add valid cargo first.")
    expect(stepBlockedReason("build", empty)).toBe("Add valid cargo first.")
    expect(stepBlockedReason("rates", fclLane(ports))).toBeNull()
    expect(stepBlockedReason("build", fclLane(ports))).toBeNull()
  })

  test("LCL / Air cargo needs a weight, volume or pallet count", () => {
    const lcl = emptyLaneFormValues("lcl")
    expect(isCargoValid(lcl)).toBe(false)
    expect(isCargoValid({ ...lcl, volume: 2 })).toBe(true)
    expect(isCargoValid({ ...lcl, palletCount: 1 })).toBe(true)
    expect(isCargoValid({ ...emptyLaneFormValues("air"), weight: 10 })).toBe(
      true
    )
  })
})
