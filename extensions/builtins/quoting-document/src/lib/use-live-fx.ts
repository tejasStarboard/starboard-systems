"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

import { fetchLiveFx } from "./live-fx"

export type LiveFxState = {
  status: "idle" | "loading" | "ok" | "error"
  /** Provider publication date of the rates last applied. */
  asOf: string | null
  refresh: () => void
}

/**
 * Keeps `quote.exchangeRates` (base → code row) in sync with the Step 1 base
 * currency. Skipped when `enabled` is false (terminal quotes keep their saved
 * rates). Failure → one non-blocking warning; prior rates stay.
 */
export function useLiveFx({
  currencyCode,
  enabled,
  onRates,
}: {
  currencyCode: string
  enabled: boolean
  /**
   * `previousBase` = last base whose rates were applied (stale row to drop);
   * `manual` = user pressed Refresh (the only case that may dirty the form).
   */
  onRates: (
    base: string,
    rates: Record<string, number>,
    meta: { previousBase: string | null; manual: boolean }
  ) => void
}): LiveFxState {
  const [state, setState] = useState<Omit<LiveFxState, "refresh">>({
    status: "idle",
    asOf: null,
  })
  const [nonce, setNonce] = useState(0)
  const forceRef = useRef(false)
  const appliedBaseRef = useRef<string | null>(null)
  const onRatesRef = useRef(onRates)
  onRatesRef.current = onRates

  useEffect(() => {
    const base = currencyCode.trim().toUpperCase()
    if (!enabled || base.length !== 3) {
      setState({ status: "idle", asOf: null })
      return
    }
    let active = true
    const force = forceRef.current
    forceRef.current = false
    setState((prev) => ({ ...prev, status: "loading" }))
    fetchLiveFx(base, { force })
      .then((fx) => {
        if (!active) return
        onRatesRef.current(base, fx.rates, {
          previousBase: appliedBaseRef.current,
          manual: force,
        })
        appliedBaseRef.current = base
        setState({ status: "ok", asOf: fx.date })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState((prev) => ({ ...prev, status: "error" }))
        toast.add({
          type: "warning",
          title: "Live FX unavailable",
          description: `${
            error instanceof Error ? error.message : "Rates could not be loaded"
          }. Keeping existing rates; set a missing rate on the charge row.`,
        })
      })
    return () => {
      active = false
    }
  }, [currencyCode, enabled, nonce])

  const refresh = useCallback(() => {
    forceRef.current = true
    setNonce((n) => n + 1)
  }, [])

  return { ...state, refresh }
}
