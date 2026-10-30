import { describe, expect, test } from "bun:test"
import {
  createRateRequestSchema,
  listRatesResponseSchema,
  type CreateRateRequest,
  type Rate,
} from "@starboard/contracts"

import { DefaultRatesService, RatesNotFoundError } from "./rates.service"
import type {
  ListRatesFilters,
  RateInsert,
  RateRow,
  RatesDao,
} from "../dao/rates.dao"

class InMemoryRatesDao implements RatesDao {
  private rates: RateRow[] = []

  async listByOrganization(
    organizationId: string,
    filters: ListRatesFilters
  ): Promise<RateRow[]> {
    return this.rates
      .filter((row) => row.organizationId === organizationId)
      .filter((row) => {
        const q = filters.q?.trim().toLowerCase()
        if (q) {
          const haystack = `${row.label} ${row.carrier ?? ""}`.toLowerCase()
          if (!haystack.includes(q)) {
            return false
          }
        }
        if (filters.origin?.trim() && row.origin !== filters.origin.trim()) {
          return false
        }
        if (
          filters.destination?.trim() &&
          row.destination !== filters.destination.trim()
        ) {
          return false
        }
        if (
          filters.customerId?.trim() &&
          row.customerId !== filters.customerId.trim()
        ) {
          return false
        }
        if (filters.validAt) {
          const at = filters.validAt.getTime()
          if (row.validFrom.getTime() > at || row.validTo.getTime() < at) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  async insert(row: RateInsert): Promise<RateRow> {
    const now = new Date()
    const created: RateRow = {
      ...row,
      createdAt: now,
      updatedAt: now,
    }
    this.rates.push(created)
    return created
  }

  async getById(organizationId: string, id: string): Promise<RateRow | null> {
    return (
      this.rates.find(
        (row) => row.organizationId === organizationId && row.id === id
      ) ?? null
    )
  }
}

function sampleInput(
  overrides: Partial<CreateRateRequest> = {}
): CreateRateRequest {
  return createRateRequestSchema.parse({
    origin: "CNSHA",
    destination: "USLAX",
    mode: "fcl",
    carrier: "Maersk",
    label: "Ocean freight",
    currencyCode: "USD",
    amount: 1200,
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T23:59:59.000Z",
    source: "manual",
    ...overrides,
  })
}

describe("DefaultRatesService org isolation", () => {
  test("org A cannot list or get org B rates", async () => {
    const dao = new InMemoryRatesDao()
    const service = new DefaultRatesService(dao)

    const rateA = await service.create(
      "org-a",
      sampleInput({ label: "A rate" })
    )
    const rateB = await service.create(
      "org-b",
      sampleInput({ label: "B rate" })
    )

    const listA = await service.list("org-a", {
      q: "",
      origin: "",
      destination: "",
      customerId: "",
      validAt: "",
    })
    expect(listA.map((row: Rate) => row.id)).toEqual([rateA.id])
    expect(listA.some((row) => row.id === rateB.id)).toBe(false)

    const listB = await service.list("org-b", {
      q: "",
      origin: "",
      destination: "",
      customerId: "",
      validAt: "",
    })
    expect(listB.map((row) => row.id)).toEqual([rateB.id])

    await expect(service.get("org-a", rateB.id)).rejects.toBeInstanceOf(
      RatesNotFoundError
    )

    const gotA = await service.get("org-a", rateA.id)
    expect(gotA.id).toBe(rateA.id)

    const contract = listRatesResponseSchema.safeParse({ rates: listA })
    expect(contract.success).toBe(true)
  })

  test("rejects empty organizationId and invalid amount", async () => {
    const service = new DefaultRatesService(new InMemoryRatesDao())

    await expect(
      service.list("", {
        q: "",
        origin: "",
        destination: "",
        customerId: "",
        validAt: "",
      })
    ).rejects.toThrow("organizationId is required")

    await expect(
      service.create("org-a", {
        ...sampleInput(),
        label: "  ",
      })
    ).rejects.toThrow("Rate label is required")
  })

  test("filters by origin and validity window", async () => {
    const service = new DefaultRatesService(new InMemoryRatesDao())

    await service.create(
      "org-a",
      sampleInput({
        origin: "CNSHA",
        destination: "USLAX",
        label: "SHA-LAX",
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: "2026-06-30T00:00:00.000Z",
      })
    )
    await service.create(
      "org-a",
      sampleInput({
        origin: "CNNGB",
        destination: "USNYC",
        label: "NGB-NYC",
        validFrom: "2026-07-01T00:00:00.000Z",
        validTo: "2026-12-31T00:00:00.000Z",
      })
    )

    const byOrigin = await service.list("org-a", {
      q: "",
      origin: "CNSHA",
      destination: "",
      customerId: "",
      validAt: "",
    })
    expect(byOrigin.map((row) => row.label)).toEqual(["SHA-LAX"])

    const byValidity = await service.list("org-a", {
      q: "",
      origin: "",
      destination: "",
      customerId: "",
      validAt: "2026-08-15T00:00:00.000Z",
    })
    expect(byValidity.map((row) => row.label)).toEqual(["NGB-NYC"])
  })
})
