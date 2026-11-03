import { describe, expect, test } from "bun:test"
import type {
  AddressPrediction,
  DoorAddress,
  FacilityOption,
  FormOption,
} from "@starboard/lib-contracts"

import type { GeographyDao } from "../dao/geography.dao"
import type { GooglePlacesClient } from "../integrations/google-places"
import { DefaultGeographyService } from "./geography.service"

const SEEDED_FACILITIES: FacilityOption[] = [
  {
    value: "CNSHA",
    label: "CNSHA — Shanghai",
    types: ["seaport"],
    country: "CN",
    latitude: 31.23,
    longitude: 121.47,
  },
  {
    value: "CNNGB",
    label: "CNNGB — Ningbo",
    types: ["seaport"],
    country: "CN",
  },
  {
    value: "CNPEK",
    label: "CNPEK — Beijing Capital",
    types: ["airport"],
    country: "CN",
  },
  {
    value: "LAX",
    label: "LAX — Los Angeles International",
    types: ["airport"],
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

  async searchPorts(
    q: string,
    filters: { country?: string; type?: string } = {}
  ): Promise<FacilityOption[]> {
    const prefix = q.trim().toUpperCase()
    const needle = q.trim().toLowerCase()
    const scoped = this.facilities.filter(
      (facility) =>
        (!filters.country || facility.country === filters.country) &&
        (!filters.type || facility.types?.includes(filters.type))
    )
    if (!prefix) {
      return scoped.slice(0, 50)
    }
    return scoped.filter((facility) => {
      if (facility.value.toUpperCase().startsWith(prefix)) return true
      const name = facility.label.split(" — ")[1]?.toLowerCase() ?? ""
      if (name.includes(needle)) return true
      return roughSimilarity(name, needle) >= 0.45
    })
  }
}

class FakePlacesClient implements Pick<
  GooglePlacesClient,
  "configured" | "searchAddresses" | "getAddressDetails"
> {
  configured = true
  private readonly predictions: AddressPrediction[] = [
    {
      placeId: "place-ram-mandir",
      description:
        "Mississauga's Ram Mandir, Export Boulevard, Mississauga, ON, Canada",
      mainText: "Mississauga's Ram Mandir",
      secondaryText: "Export Boulevard, Mississauga, ON, Canada",
    },
  ]
  private readonly details: DoorAddress = {
    street: "Export Boulevard",
    city: "Mississauga",
    state: "Ontario",
    zip: "",
    country: "Canada",
    countryCode: "CA",
    lat: 43.6,
    lng: -79.6,
    label:
      "Mississauga's Ram Mandir, Export Boulevard, Mississauga, ON, Canada",
  }

  async searchAddresses(query: string): Promise<AddressPrediction[]> {
    const needle = query.trim().toLowerCase()
    return this.predictions.filter(
      (p) =>
        p.description.toLowerCase().includes(needle) ||
        roughSimilarity(p.mainText.toLowerCase(), needle) >= 0.4
    )
  }

  async getAddressDetails(placeId: string): Promise<DoorAddress | null> {
    return placeId === "place-ram-mandir" ? this.details : null
  }
}

function roughSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const longer = a.length >= b.length ? a : b
  const shorter = a.length >= b.length ? b : a
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i]!)) matches += 1
  }
  return matches / longer.length
}

function service() {
  return new DefaultGeographyService(
    new InMemoryGeographyDao(),
    new FakePlacesClient() as unknown as GooglePlacesClient
  )
}

describe("DefaultGeographyService.searchPorts", () => {
  test("returns seeded facilities when q is empty", async () => {
    const ports = await service().searchPorts("")
    expect(ports).toHaveLength(SEEDED_FACILITIES.length)
  })

  test("filters by unlocode prefix", async () => {
    const ports = await service().searchPorts("cnsh")
    expect(ports).toEqual([SEEDED_FACILITIES[0]!])
  })

  test("returns latitude / longitude when stored", async () => {
    const [sha] = await service().searchPorts("CNSHA")
    expect(sha?.latitude).toBe(31.23)
    expect(sha?.longitude).toBe(121.47)
  })

  test("country filter returns only that country's seaports", async () => {
    const ports = await service().searchPorts("", {
      country: "cn",
      type: "seaport",
    })
    expect(ports.map((p) => p.value)).toEqual(["CNSHA", "CNNGB"])
  })

  test("country + q narrows within the country", async () => {
    const ports = await service().searchPorts("cnn", { country: "CN" })
    expect(ports.map((p) => p.value)).toEqual(["CNNGB"])
  })

  test("rejects an invalid country code", async () => {
    await expect(
      service().searchPorts("", { country: "CHN" })
    ).rejects.toThrow()
  })

  test("matches common port name typos via fuzzy stand-in", async () => {
    const ports = await service().searchPorts("Shangai")
    expect(ports.map((p) => p.value)).toContain("CNSHA")
  })
})

describe("DefaultGeographyService.searchAddresses", () => {
  test("requires at least 3 characters", async () => {
    expect(await service().searchAddresses("mi")).toEqual([])
  })

  test("returns Google Places predictions", async () => {
    const addresses = await service().searchAddresses("mississauga ram mandir")
    expect(addresses[0]?.mainText).toBe("Mississauga's Ram Mandir")
  })

  test("resolves place details into a door address snapshot", async () => {
    const address = await service().getAddressDetails("place-ram-mandir")
    expect(address.city).toBe("Mississauga")
    expect(address.street).toContain("Export")
  })
})
