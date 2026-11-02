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
