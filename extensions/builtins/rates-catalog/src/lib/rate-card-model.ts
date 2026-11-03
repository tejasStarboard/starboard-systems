import type { Rate } from "@starboard/lib-contracts"

import { spotOfferLineLabel, type SpotOffer } from "./apply-rate-to-lane"

/** Schedule / route chip. Only built from fields present on the payload. */
export type RateChip = {
  kind: "dropOff" | "cutoff" | "etd" | "eta" | "transit" | "route" | "altRoute"
  label: string
  value: string
}

/** View model for one rate card (catalog row or spot offer). */
export type RateCardModel = {
  key: string
  /** Carrier name; null when the payload has none. */
  carrier: string | null
  /** Offer / product label (e.g. "Ocean freight"). */
  title: string
  /** Label of the manual line created on Select (selection matching). */
  lineLabel: string
  amount: number
  currencyCode: string
  /** http(s) or root-relative logo URL; monogram is used when absent/broken. */
  logoUrl?: string
  /** `origin → destination` when both known. */
  lane?: string
  validity?: string
  chips: RateChip[]
  /** Raw ETD (for sorting); undefined when absent. */
  etdSort?: string
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/** First present value among aliases (payloads differ per spot plugin). */
function pick(row: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== "") return value
  }
  return undefined
}

/** `2026-11-12[T…]` → `12 Nov`; anything else is shown verbatim. */
export function formatScheduleDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) return value
  return `${Number(match[3])} ${month}`
}

function formatDateField(value: unknown): string | undefined {
  const text = nonEmptyString(value)
  return text ? formatScheduleDate(text) : undefined
}

function formatTransit(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${value} ${value === 1 ? "day" : "days"}`
  }
  return nonEmptyString(value)
}

function formatRoute(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const parts = value
      .map((part) => nonEmptyString(part))
      .filter((part): part is string => part !== undefined)
    return parts.length > 0 ? parts.join(" → ") : undefined
  }
  return nonEmptyString(value)
}

/**
 * Chips for the schedule/route fields that exist on the payload. Absent or
 * blank fields produce no chip — nothing is inferred or defaulted.
 */
export function extractRateChips(row: Record<string, unknown>): RateChip[] {
  const chips: RateChip[] = []
  const add = (kind: RateChip["kind"], label: string, value?: string) => {
    if (value) chips.push({ kind, label, value })
  }

  add(
    "dropOff",
    "Drop-off",
    formatDateField(pick(row, ["cargoDropOff", "cargoDropoff", "dropOff"]))
  )
  add("cutoff", "Cutoff", formatDateField(pick(row, ["cutoff", "cutOff"])))
  add("etd", "ETD", formatDateField(row.etd))
  add("eta", "ETA", formatDateField(row.eta))
  add(
    "transit",
    "Transit",
    formatTransit(pick(row, ["transitDays", "transitTime", "transit"]))
  )
  add("route", "Route", formatRoute(row.route))
  add(
    "altRoute",
    "Alt route",
    formatRoute(pick(row, ["altRoute", "alternateRoute", "altRoutes"]))
  )
  return chips
}

function safeLogoUrl(value: unknown): string | undefined {
  const text = nonEmptyString(value)
  if (!text) return undefined
  return /^https:\/\//i.test(text) ||
    (text.startsWith("/") && !text.startsWith("//"))
    ? text
    : undefined
}

function laneLabel(origin?: string | null, destination?: string | null) {
  return origin && destination ? `${origin} → ${destination}` : undefined
}

function etdSortKey(row: Record<string, unknown>): string | undefined {
  return nonEmptyString(row.etd)
}

export function catalogRateToCard(rate: Rate): RateCardModel {
  const row = rate as unknown as Record<string, unknown>
  return {
    key: `catalog:${rate.id}`,
    carrier: nonEmptyString(rate.carrier) ?? null,
    title: rate.label,
    lineLabel: rate.label,
    amount: rate.amount,
    currencyCode: rate.currencyCode,
    logoUrl: safeLogoUrl(row.carrierLogoUrl),
    lane: laneLabel(rate.origin, rate.destination),
    validity: `Valid ${rate.validFrom.slice(0, 10)} → ${rate.validTo.slice(0, 10)}`,
    chips: extractRateChips(row),
    etdSort: etdSortKey(row),
  }
}

export function spotOfferToCard(
  offer: SpotOffer,
  index: number
): RateCardModel {
  const row = offer as unknown as Record<string, unknown>
  return {
    key: `spot:${index}:${offer.label}:${offer.amount}`,
    carrier: nonEmptyString(offer.carrier) ?? null,
    title: offer.label,
    lineLabel: spotOfferLineLabel(offer),
    amount: offer.amount,
    currencyCode: offer.currencyCode,
    logoUrl: safeLogoUrl(row.carrierLogoUrl),
    lane: laneLabel(offer.origin, offer.destination),
    validity:
      offer.validFrom && offer.validTo
        ? `Valid ${offer.validFrom.slice(0, 10)} → ${offer.validTo.slice(0, 10)}`
        : undefined,
    chips: extractRateChips(row),
    etdSort: etdSortKey(row),
  }
}

/** Cheapest first; ties (and only ties) break by earliest ETD when present. */
export function compareRateCards(
  a: Pick<RateCardModel, "amount" | "etdSort">,
  b: Pick<RateCardModel, "amount" | "etdSort">
): number {
  if (a.amount !== b.amount) return a.amount - b.amount
  if (a.etdSort && b.etdSort) return a.etdSort.localeCompare(b.etdSort)
  if (a.etdSort) return -1
  if (b.etdSort) return 1
  return 0
}

export function sortRateCards<
  T extends Pick<RateCardModel, "amount" | "etdSort">,
>(cards: readonly T[]): T[] {
  return [...cards].sort(compareRateCards)
}

/** Up to two uppercase initials for the logo fallback (`MAERSK` → `MA`). */
export function carrierMonogram(carrier: string | null | undefined): string {
  const name = carrier?.trim()
  if (!name) return "?"
  const words = name.split(/[\s\-_/]+/).filter(Boolean)
  const letters =
    words.length > 1
      ? words
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
      : name.slice(0, 2)
  return letters.toUpperCase()
}

/** A card is selected when the lane's selected manual rate is its applied line. */
export function isRateCardSelected(
  card: Pick<RateCardModel, "lineLabel" | "amount">,
  selected: { label: string; amount: number } | null | undefined
): boolean {
  return (
    selected != null &&
    selected.label === card.lineLabel &&
    selected.amount === card.amount
  )
}
