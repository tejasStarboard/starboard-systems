import { describe, expect, test } from "bun:test"
import type { FormOption } from "@starboard/contracts"

import type { GeographyDao } from "../dao/geography.dao"
import { DefaultGeographyService } from "./geography.service"

const SEEDED_PORTS: FormOption[] = [
  { value: "CNSHA", label: "CNSHA — China" },
  { value: "DEHAM", label: "DEHAM — Germany" },
  { value: "INNSA", label: "INNSA — India" },
  { value: "NLRTM", label: "NLRTM — Netherlands" },
  { value: "SGSIN", label: "SGSIN — Singapore" },
  { value: "USLAX", label: "USLAX — United States" },
]

class InMemoryGeographyDao implements GeographyDao {
  private readonly ports: FormOption[]
  private readonly currencies = new Set<string>()

  constructor(ports: FormOption[] = SEEDED_PORTS) {
    this.ports = [...ports]
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

  async searchPorts(q: string): Promise<FormOption[]> {
    const prefix = q.trim().toUpperCase()
    if (!prefix) {
      return this.ports.slice(0, 50)
    }
    return this.ports.filter((port) =>
      port.value.toUpperCase().startsWith(prefix)
    )
  }
}

describe("DefaultGeographyService.searchPorts", () => {
  test("returns all seeded ports when q is empty", async () => {
    const service = new DefaultGeographyService(new InMemoryGeographyDao())
    const ports = await service.searchPorts("")
    expect(ports).toHaveLength(SEEDED_PORTS.length)
    expect(ports[0]?.value).toBe("CNSHA")
  })

  test("filters by unlocode prefix", async () => {
    const service = new DefaultGeographyService(new InMemoryGeographyDao())
    const ports = await service.searchPorts("cn")
    expect(ports).toEqual([{ value: "CNSHA", label: "CNSHA — China" }])
  })

  test("returns empty list when nothing matches", async () => {
    const service = new DefaultGeographyService(new InMemoryGeographyDao())
    const ports = await service.searchPorts("ZZZ")
    expect(ports).toEqual([])
  })
})
