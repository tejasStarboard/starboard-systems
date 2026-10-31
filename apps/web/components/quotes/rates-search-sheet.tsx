"use client"

import { useEffect, useMemo, useState } from "react"
import type { ManualRateLine, Rate } from "@starboard/lib-contracts"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@starboard/lib-ui/components/sheet"
import { toast } from "@starboard/lib-ui/components/toast"

import {
  catalogRateToManualLine,
  parseSpotSearchResult,
  spotOfferToManualLine,
  type SpotOffer,
} from "@/lib/domain/quotes/apply-rate-to-lane"
import { extensionApiPath } from "@/lib/extension-api-path"
import {
  pollExtensionJob,
  type PolledJobStatus,
} from "@/lib/poll-extension-job"
import type { SpotRateSource } from "@/lib/spot-rate-source"

export type ApplyRatePayload = {
  line: ManualRateLine
  currencyCode: string
}

export function RatesSearchSheet({
  open,
  onOpenChange,
  origin,
  destination,
  spotRateSources = [],
  onApplyRate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin?: string
  destination?: string
  spotRateSources?: SpotRateSource[]
  onApplyRate: (payload: ApplyRatePayload) => void
}) {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [spotJob, setSpotJob] = useState<{
    workflowId: string
    runId: string
  } | null>(null)
  const [spotStatus, setSpotStatus] = useState<PolledJobStatus | null>(null)
  const [spotPending, setSpotPending] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

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
  }, [open, origin, destination])

  const spotOffers = useMemo((): SpotOffer[] => {
    if (spotStatus?.status !== "completed") {
      return []
    }
    const parsed = parseSpotSearchResult(spotStatus.result)
    return parsed.ok ? parsed.rates : []
  }, [spotStatus])

  async function enqueueSpotSearch(extensionId: string) {
    setSpotPending(true)
    setSpotJob(null)
    setSpotStatus(null)
    try {
      const response = await fetch(extensionApiPath(extensionId, "jobs"), {
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
      setSpotStatus({ status: "running" })
      const status = await pollExtensionJob({
        extensionId,
        workflowId: payload.workflowId,
      })
      setSpotStatus(status)
      if (status.status === "failed" || status.status === "cancelled") {
        toast.add({
          type: "error",
          title: `Spot search ${status.status}`,
          description: status.error ?? "Something went wrong. Try again.",
        })
        return
      }
      if (status.status === "completed") {
        const parsed = parseSpotSearchResult(status.result)
        if (!parsed.ok) {
          toast.add({
            type: "error",
            title: "Spot search failed",
            description: parsed.error,
          })
        }
      }
    } catch (err: unknown) {
      toast.add({
        type: "error",
        title: "Unable to start spot search",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
      })
    } finally {
      setSpotPending(false)
    }
  }

  function applyCatalogRate(rate: Rate) {
    onApplyRate({
      line: catalogRateToManualLine(rate),
      currencyCode: rate.currencyCode,
    })
    onOpenChange(false)
  }

  function applySpotOffer(offer: SpotOffer) {
    onApplyRate({
      line: spotOfferToManualLine(offer),
      currencyCode: offer.currencyCode,
    })
    onOpenChange(false)
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
                        ? "Searching…"
                        : `Search ${source.displayName}`}
                    </button>
                  </li>
                ))}
              </ul>
              {spotJob ? (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    Job {spotJob.workflowId}
                    {spotStatus ? ` — ${spotStatus.status}` : ""}
                  </p>
                  {spotOffers.length > 0 ? (
                    <ul className="space-y-2">
                      {spotOffers.map((offer, index) => (
                        <li
                          key={`${offer.label}-${offer.amount}-${index}`}
                          className="border-b border-border py-2 last:border-b-0"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {offer.label}
                            </p>
                            <p className="text-sm text-foreground tabular-nums">
                              {offer.amount.toLocaleString("en-US", {
                                style: "currency",
                                currency: offer.currencyCode,
                              })}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {[offer.carrier, offer.origin, offer.destination]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <button
                            type="button"
                            className="mt-1 text-xs font-medium underline-offset-2 hover:underline"
                            onClick={() => applySpotOffer(offer)}
                          >
                            Apply to lane
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {loading ? (
            <p className="text-center text-xs text-muted-foreground">
              Loading rates…
            </p>
          ) : loadFailed ? (
            <p className="text-center text-xs text-muted-foreground">
              Couldn’t load catalog rates. Try again.
            </p>
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
                  <button
                    type="button"
                    className="mt-1 text-xs font-medium underline-offset-2 hover:underline"
                    onClick={() => applyCatalogRate(rate)}
                  >
                    Apply to lane
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
