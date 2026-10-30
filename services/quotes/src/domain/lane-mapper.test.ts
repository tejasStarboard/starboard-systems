import { describe, expect, test } from "bun:test"
import {
  createContainerLine,
  createManualRateLine,
  emptyLaneFormValues,
} from "@starboard/contracts"

import {
  cargoFromLaneForm,
  laneFormToRows,
  resolveRateValidity,
  rowsToLaneForm,
} from "./lane-mapper"

describe("lane-mapper", () => {
  test("fcl lane cargo and manual rates round-trip", () => {
    const lane = emptyLaneFormValues("fcl")
    lane.pickup = "pickup-1"
    lane.origin = "CNSHA"
    lane.destination = "USLAX"
    lane.delivery = "delivery-1"
    lane.containers = [
      createContainerLine({
        id: "ctr-1",
        containerType: "40HC",
        weight: 12000,
        count: 2,
      }),
    ]
    lane.manualRates = [
      createManualRateLine({
        id: "rate-1",
        label: "Ocean freight",
        amount: 1500,
      }),
    ]
    lane.markupType = "percent"
    lane.markupValue = 10

    const validity = resolveRateValidity({
      effectiveFrom: new Date("2026-01-01"),
      expiryAt: new Date("2026-12-31"),
    })
    const mapped = laneFormToRows(lane, "quote-1", "usd", validity)
    const restored = rowsToLaneForm(mapped.lane, mapped.rates)

    expect(mapped.lane.pickupId).toBe("pickup-1")
    expect(mapped.lane.deliveryId).toBe("delivery-1")
    expect(mapped.lane.cargo).toHaveLength(1)
    expect(mapped.lane.cargo[0]).toMatchObject({
      mode: "fcl",
      containerType: "40HC",
      containerCount: 2,
      weight: 12000,
    })
    expect(mapped.rates[0]).toMatchObject({
      id: "rate-1",
      label: "Ocean freight",
      rate: 1500,
      currencyCode: "USD",
    })
    expect(restored).toMatchObject({
      id: lane.id,
      mode: "fcl",
      pickup: "pickup-1",
      origin: "CNSHA",
      destination: "USLAX",
      delivery: "delivery-1",
      markupType: "percent",
      markupValue: 10,
      containers: [
        {
          id: "ctr-1",
          containerType: "40HC",
          weight: 12000,
          count: 2,
        },
      ],
      manualRates: [{ id: "rate-1", label: "Ocean freight", amount: 1500 }],
    })
  })

  test("lcl cargoFromLaneForm uses lane scalars", () => {
    const lane = emptyLaneFormValues("lcl")
    lane.weight = 400
    lane.volume = 2.5
    lane.palletCount = 3
    lane.palletType = "EUR"

    const cargo = cargoFromLaneForm(lane)
    expect(cargo).toHaveLength(1)
    expect(cargo[0]).toMatchObject({
      mode: "lcl",
      weight: 400,
      volume: 2.5,
      palletCount: 3,
      palletType: "EUR",
    })
  })
})
