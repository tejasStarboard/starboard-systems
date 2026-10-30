"use client"

import { useEffect, useState } from "react"
import type { Rate } from "@starboard/contracts"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

export function RatesSearchSheet({
  open,
  onOpenChange,
  origin,
  destination,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin?: string
  destination?: string
}) {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

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
        setError(err instanceof Error ? err.message : "Failed to load rates")
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [open, origin, destination])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Search rates</SheetTitle>
          <SheetDescription>
            Catalog rates matching this lane
            {origin || destination
              ? ` (${[origin, destination].filter(Boolean).join(" → ")})`
              : ""}
            .
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-8">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground">
              Loading rates…
            </p>
          ) : error ? (
            <p className="text-center text-xs text-destructive">{error}</p>
          ) : rates.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">
              No catalog rates found for this lane yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {rates.map((rate) => (
                <li
                  key={rate.id}
                  className="border-b border-border py-2 last:border-b-0"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{rate.label}</p>
                    <p className="text-sm tabular-nums">
                      {rate.amount.toLocaleString(undefined, {
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
                    Valid {rate.validFrom.slice(0, 10)} →{" "}
                    {rate.validTo.slice(0, 10)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
