"use client"

import { useEffect, useMemo, useState } from "react"

import type {
  RateSourcesSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"
import type { Rate } from "@starboard/lib-contracts"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import { toast } from "@starboard/lib-ui/components/toast"

import { RateCard, RateCardRail } from "../components/rate-card"
import { catalogRateToManualLine } from "../lib/apply-rate-to-lane"
import {
  catalogRateToCard,
  isRateCardSelected,
  rememberAppliedCard,
  sortRateCards,
} from "../lib/rate-card-model"

/**
 * `rates.catalog.source` → `quoting.slots.rateSources`: catalog rates matching
 * the lane (`GET /api/rates`) as rate cards; Select applies the rate to the
 * lane as a manual rate line. Mounted by the Rates step, so it refetches per
 * visit and whenever the lane's ports change.
 */
export function CatalogSource({
  origin,
  destination,
  selectedRate,
  onApplyRate,
}: SlotComponentProps<RateSourcesSlotProps>) {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadFailed(false)

    const params = new URLSearchParams()
    if (origin) params.set("origin", origin)
    if (destination) params.set("destination", destination)
    const qs = params.toString()
    const path = qs ? `/api/rates?${qs}` : "/api/rates"

    void fetch(path, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(body?.error ?? "Failed to load rates")
        }
        const body = (await response.json()) as { rates?: Rate[] }
        setRates(body.rates ?? [])
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setRates([])
        setLoadFailed(true)
        toast.add({
          type: "error",
          title: "Unable to load rates",
          description:
            err instanceof Error
              ? err.message
              : "Something went wrong. Try again.",
        })
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [origin, destination])

  const cards = useMemo(
    () =>
      sortRateCards(
        rates.map((rate) => ({ rate, ...catalogRateToCard(rate) }))
      ),
    [rates]
  )

  if (loading) {
    return <LoadingState size="sm">Loading rates…</LoadingState>
  }
  if (loadFailed) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Couldn’t load catalog rates. Try again.
      </p>
    )
  }
  if (rates.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        No catalog rates found for this lane yet.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Catalog rates</p>
      <RateCardRail>
        {cards.map(({ rate, ...card }) => (
          <RateCard
            key={card.key}
            card={card}
            selected={isRateCardSelected(card, selectedRate)}
            onSelect={() =>
              onApplyRate({
                line: catalogRateToManualLine(rate),
                currencyCode: rate.currencyCode,
              })
            }
          />
        ))}
      </RateCardRail>
    </div>
  )
}
