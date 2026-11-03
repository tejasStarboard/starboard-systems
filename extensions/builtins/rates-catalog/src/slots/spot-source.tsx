"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type {
  RateSourcesSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"
import { toast } from "@starboard/lib-ui/components/toast"

import { RateCard, RateCardRail } from "../components/rate-card"
import {
  parseSpotSearchResult,
  spotOfferToManualLine,
} from "../lib/apply-rate-to-lane"
import {
  isRateCardSelected,
  rememberAppliedCard,
  sortRateCards,
  spotOfferToCard,
} from "../lib/rate-card-model"
import {
  extensionApiPath,
  pollExtensionJob,
  type PolledJobStatus,
} from "../lib/extension-api"

/**
 * Generic spot-rate source (`component: "rates.spotSource"`). Optional
 * `spot.*` workers contribute into `quoting.slots.rateSources` with this
 * component; the contributing `extensionId` is the API/job owner and
 * `props.carrier` is display-only.
 */
export function SpotSource({
  origin,
  destination,
  selectedRate,
  onApplyRate,
  contribution,
}: SlotComponentProps<RateSourcesSlotProps>) {
  const extensionId = contribution.extensionId
  const displayName = contribution.label ?? extensionId
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

  // Abort the in-flight enqueue/poll on unmount.
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])

  // Offers belong to the lane they were searched for: when the ports change,
  // abort the poll and drop the job so stale cards can't be applied.
  useEffect(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setSpotPending(false)
    setSpotJob(null)
    setSpotStatus(null)
  }, [origin, destination])

  const spotCards = useMemo(() => {
    if (spotStatus?.status !== "completed") {
      return []
    }
    const parsed = parseSpotSearchResult(spotStatus.result)
    if (!parsed.ok) return []
    return sortRateCards(
      parsed.rates.map((offer, index) => ({
        offer,
        ...spotOfferToCard(offer, index, extensionId),
      }))
    )
  }, [spotStatus])

  async function enqueueSpotSearch() {
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
      if (!payload?.workflowId || !payload.runId) {
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
          {spotStatus && spotStatus.status !== "completed" ? (
            <p>
              {spotStatus.status === "running"
                ? "Searching…"
                : `Search ${spotStatus.status}`}
            </p>
          ) : null}
          {spotCards.length > 0 ? (
            <RateCardRail>
              {spotCards.map(({ offer, ...card }) => (
                <RateCard
                  key={card.key}
                  card={card}
                  selected={isRateCardSelected(card, selectedRate)}
                  onSelect={() => {
                    const line = spotOfferToManualLine(offer)
                    rememberAppliedCard(line.id, card.key)
                    onApplyRate({ line, currencyCode: offer.currencyCode })
                  }}
                />
              ))}
            </RateCardRail>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
