"use client"

import { useEffect, useState } from "react"

import type {
  RateSourcesSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"
import type { Rate } from "@starboard/lib-contracts"
import { toast } from "@starboard/lib-ui/components/toast"

import { catalogRateToManualLine } from "../lib/apply-rate-to-lane"

/**
 * `rates.catalog.source` → `quoting.slots.rateSources`: catalog rates matching
 * the lane (`GET /api/rates`), applied to the lane as a manual rate line.
 * Mounted when the rates sheet opens, so it refetches on every open.
 */
export function CatalogSource({
  origin,
  destination,
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

  if (loading) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Loading rates…
      </p>
    )
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
    <ul className="space-y-2">
      {rates.map((rate) => (
        <li
          key={rate.id}
          className="border-b border-border py-2 last:border-b-0"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium">{rate.label}</p>
            <p className="text-sm tabular-nums">
              {rate.amount.toLocaleString("en-US", {
                style: "currency",
                currency: rate.currencyCode,
              })}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {[rate.carrier, rate.origin, rate.destination]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-xs text-muted-foreground">
            Valid {rate.validFrom.slice(0, 10)} → {rate.validTo.slice(0, 10)}
          </p>
          <button
            type="button"
            className="mt-1 text-xs font-medium underline-offset-2 hover:underline"
            onClick={() =>
              onApplyRate({
                line: catalogRateToManualLine(rate),
                currencyCode: rate.currencyCode,
              })
            }
          >
            Apply to lane
          </button>
        </li>
      ))}
    </ul>
  )
}
