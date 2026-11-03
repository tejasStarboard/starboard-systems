import { describe, expect, test } from "bun:test"
import type { Rate } from "@starboard/lib-contracts"

import {
  applyClientSearchFilters,
  buildSearchRatesParams,
  emptySearchRatesFilters,
  paginateSearchRates,
  SEARCH_RATES_PAGE_SIZE,
  searchRatesTotalPages,
  sortSearchRates,
  type SearchRatesFilters,
} from "./search-rates-query"

function rate(overrides: Partial<Rate> = {}): Rate {
  return {
    id: "rate-1",
    organizationId: "org-1",
    origin: "CNSHA",
    destination: "USLAX",
    customerId: "cust-1",
    mode: "fcl",
    carrier: "MAERSK",
    label: "SHA-LAX",
    currencyCode: "USD",
    amount: 1200,
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T00:00:00.000Z",
    source: "manual",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    surcharges: [],
    ...overrides,
  }
}

describe("buildSearchRatesParams", () => {
  test("maps filled filters to existing list query keys", () => {
    const filters: SearchRatesFilters = {
      ...emptySearchRatesFilters(),
      origin: " CNSHA ",
      destination: "USLAX",
      validFrom: "2026-06-01",
      validTo: "2026-06-30",
      agent: "cust-9",
      documentId: "sheet-42",
      carrier: "ignored-on-server",
      equipment: "40HC",
    }
    const params = buildSearchRatesParams(filters)
    expect(params.get("origin")).toBe("CNSHA")
    expect(params.get("destination")).toBe("USLAX")
    expect(params.get("customerId")).toBe("cust-9")
    expect(params.get("q")).toBe("sheet-42")
    expect(params.get("validAt")).toBe("2026-06-01T00:00:00.000Z")
    expect(params.has("carrier")).toBe(false)
    expect(params.has("equipment")).toBe(false)
  })

  test("uses validTo for validAt when validFrom empty", () => {
    const params = buildSearchRatesParams({
      ...emptySearchRatesFilters(),
      validTo: "2026-07-15",
    })
    expect(params.get("validAt")).toBe("2026-07-15T00:00:00.000Z")
  })

  test("omits empty fields", () => {
    const params = buildSearchRatesParams(emptySearchRatesFilters())
    expect([...params.keys()]).toEqual([])
  })
})

describe("applyClientSearchFilters", () => {
  test("keeps only fcl rows", () => {
    const rows = applyClientSearchFilters(
      [rate({ mode: "fcl" }), rate({ id: "lcl", mode: "lcl" })],
      emptySearchRatesFilters()
    )
    expect(rows.map((r) => r.id)).toEqual(["rate-1"])
  })

  test("filters carrier case-insensitively", () => {
    const rows = applyClientSearchFilters(
      [
        rate({ id: "a", carrier: "Maersk Line" }),
        rate({ id: "b", carrier: "MSC" }),
      ],
      { ...emptySearchRatesFilters(), carrier: "maersk" }
    )
    expect(rows.map((r) => r.id)).toEqual(["a"])
  })

  test("drops rows outside validity window when both ends set", () => {
    const rows = applyClientSearchFilters(
      [
        rate({
          id: "in",
          validFrom: "2026-05-01T00:00:00.000Z",
          validTo: "2026-08-01T00:00:00.000Z",
        }),
        rate({
          id: "out",
          validFrom: "2025-01-01T00:00:00.000Z",
          validTo: "2025-06-01T00:00:00.000Z",
        }),
      ],
      {
        ...emptySearchRatesFilters(),
        validFrom: "2026-06-01",
        validTo: "2026-06-30",
      }
    )
    expect(rows.map((r) => r.id)).toEqual(["in"])
  })
})

describe("sortSearchRates", () => {
  test("sorts by amount ascending", () => {
    const sorted = sortSearchRates(
      [rate({ id: "hi", amount: 2000 }), rate({ id: "lo", amount: 500 })],
      "amount"
    )
    expect(sorted.map((r) => r.id)).toEqual(["lo", "hi"])
  })

  test("sorts by lane", () => {
    const sorted = sortSearchRates(
      [
        rate({ id: "b", origin: "USLAX", destination: "CNSHA" }),
        rate({ id: "a", origin: "CNSHA", destination: "USLAX" }),
      ],
      "lane"
    )
    expect(sorted.map((r) => r.id)).toEqual(["a", "b"])
  })
})

describe("paginateSearchRates", () => {
  const rows = Array.from({ length: 30 }, (_, i) => rate({ id: `r-${i}` }))

  test("returns first page of SEARCH_RATES_PAGE_SIZE", () => {
    const page = paginateSearchRates(rows, 1)
    expect(page).toHaveLength(SEARCH_RATES_PAGE_SIZE)
    expect(page[0]?.id).toBe("r-0")
    expect(page.at(-1)?.id).toBe("r-24")
  })

  test("returns remainder on last page", () => {
    const page = paginateSearchRates(rows, 2)
    expect(page.map((r) => r.id)).toEqual([
      "r-25",
      "r-26",
      "r-27",
      "r-28",
      "r-29",
    ])
  })

  test("total pages is at least 1", () => {
    expect(searchRatesTotalPages(0)).toBe(1)
    expect(searchRatesTotalPages(25)).toBe(1)
    expect(searchRatesTotalPages(26)).toBe(2)
  })
})
