import type { Rate } from "@starboard/lib-contracts"

/** Draft filters for Ocean FCL Search Rates (097). */
export type SearchRatesFilters = {
  origin: string
  destination: string
  validFrom: string
  validTo: string
  equipment: string
  agent: string
  carrier: string
  documentId: string
}

export type SearchRatesSort = "lane" | "carrier" | "validity" | "amount"

export const EQUIPMENT_OPTIONS = ["20GP", "40GP", "40HC"] as const

export function emptySearchRatesFilters(): SearchRatesFilters {
  return {
    origin: "",
    destination: "",
    validFrom: "",
    validTo: "",
    equipment: "",
    agent: "",
    carrier: "",
    documentId: "",
  }
}

/** Map draft filters → `GET /api/rates` query (existing list params only). */
export function buildSearchRatesParams(
  filters: SearchRatesFilters
): URLSearchParams {
  const params = new URLSearchParams()
  const origin = filters.origin.trim()
  if (origin) params.set("origin", origin)
  const destination = filters.destination.trim()
  if (destination) params.set("destination", destination)
  const agent = filters.agent.trim()
  if (agent) params.set("customerId", agent)
  const documentId = filters.documentId.trim()
  if (documentId) params.set("q", documentId)
  const validAtDate = filters.validFrom.trim() || filters.validTo.trim()
  if (validAtDate) {
    params.set("validAt", `${validAtDate}T00:00:00.000Z`)
  }
  return params
}

function dayStartMs(dateYmd: string): number {
  return Date.parse(`${dateYmd}T00:00:00.000Z`)
}

function dayEndMs(dateYmd: string): number {
  return Date.parse(`${dateYmd}T23:59:59.999Z`)
}

/**
 * Client post-filters after the catalog list response:
 * FCL-only, optional carrier substring, optional validity-window overlap.
 * Equipment is UI-only (catalog has no per-CT amounts).
 */
export function applyClientSearchFilters(
  rates: Rate[],
  filters: SearchRatesFilters
): Rate[] {
  const carrierNeedle = filters.carrier.trim().toLowerCase()
  const windowFrom = filters.validFrom.trim()
  const windowTo = filters.validTo.trim()
  const bothEnds = Boolean(windowFrom && windowTo)

  return rates.filter((rate) => {
    if (rate.mode !== "fcl") return false
    if (carrierNeedle) {
      const carrier = (rate.carrier ?? "").toLowerCase()
      if (!carrier.includes(carrierNeedle)) return false
    }
    if (bothEnds) {
      const rateFrom = Date.parse(rate.validFrom)
      const rateTo = Date.parse(rate.validTo)
      if (Number.isNaN(rateFrom) || Number.isNaN(rateTo)) return false
      if (rateTo < dayStartMs(windowFrom) || rateFrom > dayEndMs(windowTo)) {
        return false
      }
    }
    return true
  })
}

function laneKey(rate: Rate): string {
  return `${rate.origin ?? ""}→${rate.destination ?? ""}`
}

export function sortSearchRates(rates: Rate[], sort: SearchRatesSort): Rate[] {
  const copy = [...rates]
  copy.sort((a, b) => {
    switch (sort) {
      case "lane":
        return laneKey(a).localeCompare(laneKey(b))
      case "carrier":
        return (a.carrier ?? "").localeCompare(b.carrier ?? "")
      case "validity":
        return a.validFrom.localeCompare(b.validFrom)
      case "amount":
        return a.amount - b.amount
      default:
        return 0
    }
  })
  return copy
}
