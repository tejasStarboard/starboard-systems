import { describe, expect, test } from "bun:test"
import type { FacilityOption, FormOption } from "@starboard/contracts"

import type { GeographyDao } from "../dao/geography.dao"
import { DefaultGeographyService } from "./geography.service"

const SEEDED_FACILITIES: FacilityOption[] = [
  {
    value: "CNSHA",
    label: "CNSHA — Shanghai",
    types: ["seaport"],
    country: "CN",
  },
  {
    value: "DEHAM",
    label: "DEHAM — Hamburg",
    types: ["seaport"],
    country: "DE",
  },
  {
    value: "INNSA",
    label: "INNSA — Nhava Sheva",
    types: ["seaport"],
    country: "IN",
  },
  {
    value: "LAX",
    label: "LAX — Los Angeles International",
    types: ["airport"],
    country: "US",
  },
  {
    value: "NLRTM",
    label: "NLRTM — Rotterdam",
    types: ["seaport"],
    country: "NL",
  },
  {
    value: "PVG",
    label: "PVG — Shanghai Pudong",
    types: ["airport"],
    country: "CN",
  },
  {
    value: "SGSIN",
    label: "SGSIN — Singapore",
    types: ["seaport"],
    country: "SG",
  },
  {
    value: "SIN",
    label: "SIN — Singapore Changi",
    types: ["airport"],
    country: "SG",
  },
  {
    value: "USLAX",
    label: "USLAX — Los Angeles",
    types: ["seaport"],
    country: "US",
  },
]

class InMemoryGeographyDao implements GeographyDao {
  private readonly facilities: FacilityOption[]
  private readonly currencies = new Set<string>()

  constructor(facilities: FacilityOption[] = SEEDED_FACILITIES) {
    this.facilities = [...facilities]
  }

  async ensureCurrency(code: string): Promise<string> {
    const normalized = code.trim().toUpperCase()
    this.currencies.add(normalized)
    return normalized
  }

  async listCurrencies(): Promise<FormOption[]> {
    return [...this.currencies]
      .sort()
      .map((code) => ({ value: code, label: code }))
  }

  async searchPorts(q: string): Promise<FacilityOption[]> {
    const prefix = q.trim().toUpperCase()
    const needle = q.trim().toLowerCase()
    if (!prefix) {
      return this.facilities.slice(0, 50)
    }
    return this.facilities.filter((facility) => {
      if (facility.value.toUpperCase().startsWith(prefix)) return true
      const name = facility.label.split(" — ")[1]?.toLowerCase() ?? ""
      return name.includes(needle)
    })
  }
}

describe("DefaultGeographyService.searchPorts", () => {
  test("returns all seeded facilities when q is empty", async () => {
    const service = new DefaultGeographyService(new InMemoryGeographyDao())
    const ports = await service.searchPorts("")
    expect(ports).toHaveLength(SEEDED_FACILITIES.length)
    expect(ports[0]?.value).toBe("CNSHA")
  })

  test("filters by unlocode prefix", async () => {
    const service = new DefaultGeographyService(new InMemoryGeographyDao())
    const ports = await service.searchPorts("cn")
    expect(ports).toEqual([
      {
        value: "CNSHA",
        label: "CNSHA — Shanghai",
        types: ["seaport"],
        country: "CN",
      },
    ])
  })

  test("filters by IATA code", async () => {
    const service = new DefaultGeographyService(new InMemoryGeographyDao())
    const ports = await service.searchPorts("LAX")
    expect(ports).toEqual([
      {
        value: "LAX",
        label: "LAX — Los Angeles International",
        types: ["airport"],
        country: "US",
      },
    ])
  })

  test("filters by facility name", async () => {
    const service = new DefaultGeographyService(new InMemoryGeographyDao())
    const ports = await service.searchPorts("Rotterdam")
    expect(ports).toEqual([
      {
        value: "NLRTM",
        label: "NLRTM — Rotterdam",
        types: ["seaport"],
        country: "NL",
      },
    ])
  })

  test("returns empty list when nothing matches", async () => {
    const service = new DefaultGeographyService(new InMemoryGeographyDao())
    const ports = await service.searchPorts("ZZZ")
    expect(ports).toEqual([])
  })
})
