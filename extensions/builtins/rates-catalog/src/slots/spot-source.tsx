"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

import {
  parseSpotSearchResult,
  spotOfferToManualLine,
  type SpotOffer,
} from "../lib/apply-rate-to-lane"
import {
  extensionApiPath,
  pollExtensionJob,
  type PolledJobStatus,
} from "../lib/extension-api"
import type { SlotContribution } from "../host"

/** Apply payload for quote `rateSources` (optional on standalone Spot search). */
export type SpotApplyRatePayload = {
  line: ReturnType<typeof spotOfferToManualLine>
  currencyCode: string
}

/**
 * Props for the generic `rates.spotSource` panel. Used from both
 * `quoting.slots.rateSources` (with `onApplyRate`) and
 * `rates.slots.spotSearch` (browse-only, no apply).
 */
export type SpotSourceProps = {
  contribution: SlotContribution & { extensionId?: string }
  origin?: string
  destination?: string
  onApplyRate?: (payload: SpotApplyRatePayload) => void
}

/**
 * Generic spot-rate source (`component: "rates.spotSource"`). Optional
 * `spot.*` workers contribute into quote `rateSources` and/or standalone
 * `rates.slots.spotSearch` with this component; the contributing
 * `extensionId` is the API/job owner and `props.carrier` is display-only.
 */
export function SpotSource({
  origin,
  destination,
  onApplyRate,
  contribution,
}: SpotSourceProps) {
  const extensionId = contribution.extensionId
  const displayName = contribution.label ?? extensionId ?? contribution.id
  const carrier =
    typeof contribution.props?.carrier === "string"
      ? contribution.props.carrier
      : undefined

  const [spotJob, setSpotJob] = useState<{
    workflowId: string
    runId: string
  } | null>(null)
  const [spotStatus, setSpotStatus] = useState<PolledJobStatus | null>(null)
  const [spotPending, setSpotPending] = useState(false)

  // Abort the in-flight enqueue/poll when the panel unmounts.
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])

  const spotOffers = useMemo((): SpotOffer[] => {
    if (spotStatus?.status !== "completed") {
      return []
    }
    const parsed = parseSpotSearchResult(spotStatus.result)
    return parsed.ok ? parsed.rates : []
  }, [spotStatus])

  async function enqueueSpotSearch() {
    if (!extensionId) {
      toast.add({
        type: "error",
        title: "Unable to start spot search",
        description: "Missing extension id for this spot source.",
      })
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    setSpotPending(true)
    setSpotJob(null)
    setSpotStatus(null)
    try {
      const response = await fetch(extensionApiPath(extensionId, "jobs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, mode: "fcl" }),
        signal,
      })
      const payload = (await response.json().catch(() => null)) as {
        workflowId?: string
        runId?: string
        error?: string
      } | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to enqueue spot search")
      }
      if (!payload?.workflowId || !payload?.runId) {
        throw new Error("Invalid spot search response")
      }
      setSpotJob({ workflowId: payload.workflowId, runId: payload.runId })
      setSpotStatus({ status: "running" })
      const status = await pollExtensionJob({
        extensionId,
        workflowId: payload.workflowId,
        signal,
      })
      if (signal.aborted) return
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
      if (signal.aborted) return
      toast.add({
        type: "error",
        title: "Unable to start spot search",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
      })
    } finally {
      if (!signal.aborted) setSpotPending(false)
    }
  }

  return (
    <div className="space-y-2 border-b border-border pb-3">
      <p className="text-xs font-medium text-muted-foreground">Spot source</p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span>{displayName}</span>
          {carrier ? (
            <span className="text-xs text-muted-foreground">{carrier}</span>
          ) : null}
        </div>
        <button
          type="button"
          className="text-xs font-medium underline-offset-2 hover:underline disabled:opacity-50"
          disabled={spotPending}
          onClick={() => void enqueueSpotSearch()}
        >
          {spotPending ? "Searching…" : `Search ${displayName}`}
        </button>
      </div>
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
                  {onApplyRate ? (
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium underline-offset-2 hover:underline"
                      onClick={() =>
                        onApplyRate({
                          line: spotOfferToManualLine(offer),
                          currencyCode: offer.currencyCode,
                        })
                      }
                    >
                      Apply to lane
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
