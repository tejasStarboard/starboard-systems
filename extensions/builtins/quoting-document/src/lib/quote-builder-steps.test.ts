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

describe("quote builder steps", () => {
  test("orders Route → Rate", () => {
    expect(nextStep("route")).toBe("rate")
    expect(nextStep("rate")).toBeNull()
    expect(previousStep("route")).toBeNull()
    expect(previousStep("rate")).toBe("route")
  })

  test("Route is always open", () => {
    const lane = emptyLaneFormValues("fcl")
    expect(stepBlockedReason("route", lane)).toBeNull()
  })

  test("ports and cargo gate Rate", () => {
    const empty = fclLane()
    expect(stepBlockedReason("rate", empty)).toBe(
      "Set origin and destination first."
    )

    const portsOnly = {
      ...empty,
      origin: "NLRTM",
      destination: "USNYC",
      containers: [createContainerLine({ containerType: "", count: 1 })],
    }
    expect(stepBlockedReason("rate", portsOnly)).toBe("Add valid cargo first.")

    expect(
      stepBlockedReason("rate", fclLane({ origin: "NLRTM", destination: "USNYC" }))
    ).toBeNull()
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
