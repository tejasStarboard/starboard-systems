/**
 * Quote FX helpers — lean port of starboard-2 `currencyConversion`
 * (`tryGetFxRate` / `tryConvertCurrency`). Direct rate, else inverse.
 */

export type FxRates = Record<string, Record<string, number>>

function isValidRate(rate: unknown): rate is number {
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0
}

/** Strict FX lookup. Null when neither direct nor inverse rate is usable. */
export function tryGetFxRate(
  fromCurrency: string,
  toCurrency: string,
  fxRates: FxRates
): number | null {
  const from = fromCurrency.trim().toUpperCase()
  const to = toCurrency.trim().toUpperCase()
  if (!from || !to) {
    return null
  }
  if (from === to) {
    return 1
  }

  const direct = fxRates[from]?.[to]
  if (isValidRate(direct)) {
    return direct
  }

  const inverse = fxRates[to]?.[from]
  if (isValidRate(inverse)) {
    return 1 / inverse
  }

  return null
}

/**
 * Convert `amount` from `fromCurrency` into `toCurrency`.
 * Same currency → passthrough. Missing rate → `{ missing: true }`.
 */
export function tryConvertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  fxRates: FxRates
): { converted: number; fxRate: number } | { missing: true } {
  const rate = tryGetFxRate(fromCurrency, toCurrency, fxRates)
  if (rate == null) {
    return { missing: true }
  }
  const converted = amount * rate
  if (!Number.isFinite(converted)) {
    return { missing: true }
  }
  return { converted, fxRate: rate }
}

/**
 * Convert into quote currency for totals. Same/blank currencies pass through.
 * Missing FX → 0 (caller can surface via {@link listFxMisses} later).
 */
export function convertToQuoteCurrency(
  amount: number,
  lineCurrency: string | null | undefined,
  quoteCurrency: string | null | undefined,
  fxRates: FxRates | null | undefined
): number {
  const from = (lineCurrency ?? "").trim().toUpperCase()
  const to = (quoteCurrency ?? "").trim().toUpperCase()
  if (!from || !to || from === to) {
    return Number.isFinite(amount) ? amount : 0
  }
  const result = tryConvertCurrency(amount, from, to, fxRates ?? {})
  if ("missing" in result) {
    return 0
  }
  return result.converted
}

/**
 * Merge live provider rates (`1 base = rate × code`) into a quote's
 * `exchangeRates` as the `base → code` row. Only valid positive rates are
 * written; other rows (manual `line → base` overrides) are untouched and keep
 * winning in {@link tryGetFxRate}. Returns the same reference when nothing
 * changed so callers can skip a dirty form write.
 */
export function mergeBaseFxRates(
  current: FxRates | null | undefined,
  baseCurrency: string,
  liveRates: Record<string, number>,
  options: { dropBase?: string } = {}
): FxRates {
  let prev = current ?? {}
  // Base changed: the old base's row is live-derived; drop it so a stale
  // direct pair cannot outrank the fresh inverse.
  const drop = options.dropBase?.trim().toUpperCase()
  if (drop && drop !== baseCurrency.trim().toUpperCase() && drop in prev) {
    prev = Object.fromEntries(
      Object.entries(prev).filter(([code]) => code !== drop)
    )
  }
  const base = baseCurrency.trim().toUpperCase()
  if (!base) {
    return prev
  }
  const row: Record<string, number> = {}
  for (const [code, rate] of Object.entries(liveRates)) {
    const to = code.trim().toUpperCase()
    if (to && to !== base && isValidRate(rate)) {
      row[to] = rate
    }
  }
  const existing = prev[base] ?? {}
  const keys = Object.keys(row)
  const unchanged =
    keys.length === Object.keys(existing).length &&
    keys.every((key) => existing[key] === row[key])
  if (unchanged) {
    return prev
  }
  return { ...prev, [base]: row }
}
