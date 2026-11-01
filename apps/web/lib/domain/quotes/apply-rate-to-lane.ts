import {
  createManualRateLine,
  createSurchargeLine,
  type ManualRateLine,
  type Rate,
  type SurchargeLine,
} from "@starboard/lib-contracts"

/** Spot offer row from a completed search workflow `result.rates[]`. */
export type SpotOffer = {
  origin?: string | null
  destination?: string | null
  carrier?: string | null
  label: string
  currencyCode: string
  amount: number
  validFrom?: string
  validTo?: string
  source?: string
  mode?: string
  /** Charge lines when the spot strategy returns them. */
  surcharges?: SurchargeLine[]
}

export type SpotSearchWorkflowResult = {
  status: "completed" | "failed" | "error"
  rates: SpotOffer[]
  error?: { code?: string; message?: string } | null
}

export type ParseSpotSearchResult =
  { ok: true; rates: SpotOffer[] } | { ok: false; error: string }

/** Clone source charge lines onto a new manual rate (fresh ids). */
export function mapSurchargesToManual(
  source: SurchargeLine[] | undefined | null
): SurchargeLine[] {
  if (source == null || source.length === 0) {
    return []
  }
  return source.map((line) =>
    createSurchargeLine({
      ...line,
      id: crypto.randomUUID(),
    })
  )
}

export function catalogRateToManualLine(rate: Rate): ManualRateLine {
  return createManualRateLine({
    label: rate.label,
    amount: rate.amount,
    surcharges: mapSurchargesToManual(rate.surcharges),
  })
}

export function spotOfferToManualLine(offer: SpotOffer): ManualRateLine {
  const label = offer.carrier
    ? `${offer.label} (${offer.carrier})`
    : offer.label
  return createManualRateLine({
    label,
    amount: offer.amount,
    surcharges: mapSurchargesToManual(offer.surcharges),
  })
}

function isSpotOffer(value: unknown): value is SpotOffer {
  if (value == null || typeof value !== "object") {
    return false
  }
  const row = value as Record<string, unknown>
  return (
    typeof row.label === "string" &&
    typeof row.currencyCode === "string" &&
    typeof row.amount === "number" &&
    Number.isFinite(row.amount)
  )
}

/**
 * Parse a polled spot job `result` after Temporal status is `completed`.
 * Workflow may still return `status: "failed"` / `"error"` or an empty `rates` list.
 */
export function parseSpotSearchResult(result: unknown): ParseSpotSearchResult {
  if (result == null || typeof result !== "object") {
    return { ok: false, error: "No offers returned from spot search" }
  }

  const body = result as Record<string, unknown>
  const status = body.status

  if (status === "failed" || status === "error") {
    const err = body.error
    if (err != null && typeof err === "object") {
      const message = (err as { message?: unknown }).message
      if (typeof message === "string" && message.trim().length > 0) {
        return { ok: false, error: message }
      }
    }
    return { ok: false, error: "Spot search failed" }
  }

  const rawRates = body.rates
  if (!Array.isArray(rawRates)) {
    return { ok: false, error: "No offers returned from spot search" }
  }

  const rates = rawRates.filter(isSpotOffer)
  if (rates.length === 0) {
    return { ok: false, error: "No offers returned from spot search" }
  }

  return { ok: true, rates }
}
