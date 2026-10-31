"use client"

import { useEffect, useState } from "react"
import type { Rate } from "@starboard/lib-contracts"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@starboard/lib-ui/components/sheet"

import type { SpotRateSource } from "@/lib/spot-rate-source"

export function RatesSearchSheet({
  open,
  onOpenChange,
  origin,
  destination,
  spotRateSources = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin?: string
  destination?: string
  spotRateSources?: SpotRateSource[]
}) {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spotJob, setSpotJob] = useState<{
    workflowId: string
    runId: string
  } | null>(null)
  const [spotPending, setSpotPending] = useState(false)
  const [spotError, setSpotError] = useState<string | null>(null)

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

  async function enqueueSpotSearch(extensionId: string) {
    setSpotPending(true)
    setSpotError(null)
    setSpotJob(null)
    try {
      const response = await fetch(`/api/extensions/${extensionId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, mode: "fcl" }),
      })
      const payload = (await response.json().catch(() => null)) as {
        workflowId?: string
        runId?: string
        error?: string
      } | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to enqueue spot search")
      }
      if (!payload?.workflowId || !payload.runId) {
        throw new Error("Invalid spot search response")
      }
      setSpotJob({ workflowId: payload.workflowId, runId: payload.runId })
    } catch (err: unknown) {
      setSpotError(
        err instanceof Error ? err.message : "Failed to enqueue spot search"
      )
    } finally {
      setSpotPending(false)
    }
  }

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
          {spotRateSources.length > 0 ? (
            <div className="space-y-2 border-b border-border pb-3">
              <p className="text-xs font-medium text-muted-foreground">
                Spot sources
              </p>
              <ul className="space-y-2">
                {spotRateSources.map((source) => (
                  <li key={source.id} className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span>{source.displayName}</span>
                      {source.carrier ? (
                        <span className="text-xs text-muted-foreground">
                          {source.carrier}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium underline-offset-2 hover:underline disabled:opacity-50"
                      disabled={spotPending}
                      onClick={() => void enqueueSpotSearch(source.id)}
                    >
                      {spotPending
                        ? "Enqueueing…"
                        : `Search ${source.displayName}`}
                    </button>
                  </li>
                ))}
              </ul>
              {spotJob ? (
                <p className="text-xs text-muted-foreground">
                  Accepted 202 — workflowId={spotJob.workflowId} runId=
                  {spotJob.runId}
                </p>
              ) : null}
              {spotError ? (
                <p className="text-xs text-destructive">{spotError}</p>
              ) : null}
            </div>
          ) : null}
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
