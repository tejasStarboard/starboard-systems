import { describe, expect, test } from "bun:test"
import type { Rate } from "@starboard/lib-contracts"

import type { SpotOffer } from "./apply-rate-to-lane"
import {
  carrierMonogram,
  catalogRateToCard,
  extractRateChips,
  formatScheduleDate,
  isRateCardSelected,
  rememberAppliedCard,
  sortRateCards,
  spotOfferToCard,
} from "./rate-card-model"

const rate: Rate = {
  id: "rate-1",
  organizationId: "org-1",
  origin: "SGSIN",
  destination: "NLRTM",
  customerId: null,
  mode: "fcl",
  carrier: "MAERSK",
  label: "Ocean freight",
  currencyCode: "USD",
  amount: 1500,
  validFrom: "2026-01-01",
  validTo: "2026-12-31",
  source: "manual",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  surcharges: [],
}

describe("extractRateChips", () => {
  test("returns no chips when schedule fields are absent", () => {
    expect(extractRateChips({ label: "x", amount: 1 })).toEqual([])
    expect(extractRateChips({ etd: "", eta: "  ", transitDays: 0 })).toEqual([])
  })

  test("builds chips only for present fields, in display order", () => {
    const chips = extractRateChips({
      etd: "2026-11-12T00:00:00Z",
      transitDays: 28,
      route: ["SGSIN", "LKCMB", "NLRTM"],
      altRoute: "via Suez",
    })
    expect(chips.map((chip) => [chip.kind, chip.value])).toEqual([
      ["etd", "12 Nov"],
      ["transit", "28 days"],
      ["route", "SGSIN → LKCMB → NLRTM"],
      ["altRoute", "via Suez"],
    ])
  })

  test("reads drop-off / cutoff / eta and aliases", () => {
    const chips = extractRateChips({
      dropOff: "2026-11-05",
      cutOff: "2026-11-08",
      eta: "2026-12-10",
      transitTime: "28d",
    })
    expect(chips.map((chip) => chip.kind)).toEqual([
      "dropOff",
      "cutoff",
      "eta",
      "transit",
    ])
  })

  test("formats singular transit and leaves non-ISO dates verbatim", () => {
    expect(extractRateChips({ transitDays: 1 })[0]?.value).toBe("1 day")
    expect(formatScheduleDate("Nov 12")).toBe("Nov 12")
  })
})

describe("cards", () => {
  test("catalog rate has no chips (no schedule fields) and keeps carrier", () => {
    const card = catalogRateToCard(rate)
    expect(card.chips).toEqual([])
    expect(card.carrier).toBe("MAERSK")
    expect(card.lane).toBe("SGSIN → NLRTM")
    expect(card.lineLabel).toBe("Ocean freight")
  })

  test("spot offer surfaces richer payload fields and applied label", () => {
    const offer: SpotOffer = {
      label: "Spot 40HC",
      carrier: "MAERSK",
      currencyCode: "USD",
      amount: 2000,
      etd: "2026-11-12",
      transitDays: 30,
    }
    const card = spotOfferToCard(offer, 0)
    expect(card.chips.map((chip) => chip.kind)).toEqual(["etd", "transit"])
    expect(card.lineLabel).toBe("Spot 40HC (MAERSK)")
  })

  test("logo URL only accepts https or root-relative paths", () => {
    const base = { label: "x", currencyCode: "USD", amount: 1 }
    const ok = spotOfferToCard(
      { ...base, carrierLogoUrl: "https://cdn.example/logo.png" },
      0
    )
    const rel = spotOfferToCard({ ...base, carrierLogoUrl: "/logos/m.svg" }, 0)
    const bad = spotOfferToCard(
      { ...base, carrierLogoUrl: "javascript:alert(1)" },
      0
    )
    expect(ok.logoUrl).toBe("https://cdn.example/logo.png")
    expect(rel.logoUrl).toBe("/logos/m.svg")
    expect(bad.logoUrl).toBeUndefined()
  })
})

describe("sortRateCards", () => {
  test("price ascending, ties by ETD when present", () => {
    const mk = (amount: number, etd?: string) => ({ amount, etdSort: etd })
    const sorted = sortRateCards([
      mk(200, "2026-11-20"),
      mk(100),
      mk(200, "2026-11-10"),
      mk(200),
    ])
    expect(sorted).toEqual([
      mk(100),
      mk(200, "2026-11-10"),
      mk(200, "2026-11-20"),
      mk(200),
    ])
  })
})

describe("monogram + selection", () => {
  test("monogram fallbacks", () => {
    expect(carrierMonogram("MAERSK")).toBe("MA")
    expect(carrierMonogram("Hapag Lloyd")).toBe("HL")
    expect(carrierMonogram(null)).toBe("?")
    expect(carrierMonogram("  ")).toBe("?")
  })

  test("falls back to label + amount when the line id is unknown", () => {
    const card = catalogRateToCard(rate)
    const sel = { id: "restored", label: "Ocean freight", amount: 1500 }
    expect(isRateCardSelected(card, sel)).toBe(true)
    expect(isRateCardSelected(card, { ...sel, amount: 1 })).toBe(false)
    expect(isRateCardSelected(card, null)).toBe(false)
  })

  test("known line id selects only the card it was applied from", () => {
    const a = catalogRateToCard(rate)
    const b = catalogRateToCard({ ...rate, id: "rate-2", carrier: "MSC" })
    rememberAppliedCard("line-b", b.key)
    const sel = { id: "line-b", label: "Ocean freight", amount: 1500 }
    expect(isRateCardSelected(b, sel)).toBe(true)
    // Same label + amount, different card: no collision.
    expect(isRateCardSelected(a, sel)).toBe(false)
  })
})
