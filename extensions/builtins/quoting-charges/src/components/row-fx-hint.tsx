"use client"

import { tryConvertCurrency, tryGetFxRate } from "@starboard/lib-pricing"
import { Input } from "@starboard/lib-ui/components/input"

/**
 * Display FX when line currency ≠ quote currency (starboard-2 row FX).
 * Allows setting a direct rate into `exchangeRates` when missing.
 */
export function RowFxHint({
  lineCurrency,
  quoteCurrency,
  exchangeRates,
  onSetRate,
}: {
  lineCurrency: string
  quoteCurrency: string
  exchangeRates: Record<string, Record<string, number>>
  onSetRate: (from: string, to: string, rate: number) => void
}) {
  const from = lineCurrency.trim().toUpperCase()
  const to = quoteCurrency.trim().toUpperCase()
  if (!from || !to || from === to) {
    return null
  }

  const rate = tryGetFxRate(from, to, exchangeRates)
  const sample = tryConvertCurrency(1, from, to, exchangeRates)

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span className="font-mono">
        {from}→{to}
      </span>
      {rate != null && "converted" in sample ? (
        <span title="FX applied in totals">
          @ {rate.toFixed(6)} (1 {from} = {sample.converted.toFixed(4)} {to})
        </span>
      ) : (
        <label className="flex items-center gap-1">
          <span>FX missing — set rate</span>
          <Input
            type="number"
            step="0.000001"
            min="0"
            className="h-7 w-24 text-right tabular-nums"
            placeholder="rate"
            onBlur={(event) => {
              const next = Number(event.target.value)
              if (Number.isFinite(next) && next > 0) {
                onSetRate(from, to, next)
              }
            }}
          />
        </label>
      )}
    </div>
  )
}
