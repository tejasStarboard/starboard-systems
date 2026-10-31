import { describe, expect, test } from "bun:test"
import {
  createContainerLine,
  createManualRateLine,
  createSurchargeLine,
  emptyLaneFormValues,
} from "@starboard/lib-contracts"

import {
  cargoFromLaneForm,
  laneFormToRows,
  resolveRateValidity,
  rowsToLaneForm,
  type SurchargeRow,
} from "./lane-mapper"

describe("lane-mapper", () => {
  test("fcl lane cargo and manual rates round-trip", () => {
    const lane = emptyLaneFormValues("fcl")
    lane.pickup = {
      street: "1 Export Blvd",
      city: "Mississauga",
      state: "ON",
      zip: "L5T",
      country: "Canada",
      countryCode: "CA",
      lat: 43.6,
      lng: -79.6,
      label: "1 Export Blvd, Mississauga, ON, Canada",
    }
    lane.origin = "CNSHA"
    lane.destination = "USLAX"
    lane.delivery = {
      street: "100 Main St",
      city: "Brambleton",
      state: "VA",
      zip: "20148",
      country: "United States",
      countryCode: "US",
      lat: 38.9,
      lng: -77.5,
      label: "100 Main St, Brambleton, VA, USA",
    }
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
        surcharges: [
          createSurchargeLine({
            id: "sch-1",
            name: "Origin THC",
            leg: "origin",
            usageUnit: "container",
            rate: 120,
            currencyCode: "USD",
            source: "manual",
            isIncludedInTotal: true,
            isRemoved: false,
            isVisible: true,
            freeUsage: null,
            minUsage: 1,
            maxUsage: null,
            buyAmount: 100,
            sellAmount: 120,
          }),
        ],
      }),
    ]
    lane.markupType = "percent"
    lane.markupValue = 10

    const validity = resolveRateValidity({
      effectiveFrom: new Date("2026-01-01"),
      expiryAt: new Date("2026-12-31"),
    })
    const mapped = laneFormToRows(lane, "quote-1", "usd", validity)
    const surchargesByRateId = new Map<string, SurchargeRow[]>()
    for (const row of mapped.surcharges) {
      const list = surchargesByRateId.get(row.rateId) ?? []
      list.push(row)
      surchargesByRateId.set(row.rateId, list)
    }
    const restored = rowsToLaneForm(
      mapped.lane,
      mapped.rates,
      surchargesByRateId
    )

    expect(mapped.lane.pickupAddress?.city).toBe("Mississauga")
    expect(mapped.lane.deliveryAddress?.city).toBe("Brambleton")
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
    expect(mapped.surcharges).toHaveLength(1)
    expect(mapped.surcharges[0]).toMatchObject({
      id: "sch-1",
      rateId: "rate-1",
      name: "Origin THC",
      leg: "origin",
      usageUnit: "container",
      buyAmount: 100,
      sellAmount: 120,
    })
    expect(restored).toMatchObject({
      id: lane.id,
      mode: "fcl",
      pickup: expect.objectContaining({ city: "Mississauga" }),
      origin: "CNSHA",
      destination: "USLAX",
      delivery: expect.objectContaining({ city: "Brambleton" }),
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
      manualRates: [
        {
          id: "rate-1",
          label: "Ocean freight",
          amount: 1500,
          surcharges: [
            {
              id: "sch-1",
              name: "Origin THC",
              leg: "origin",
              usageUnit: "container",
              rate: 120,
              buyAmount: 100,
              sellAmount: 120,
            },
          ],
        },
      ],
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
