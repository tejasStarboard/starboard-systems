import type { FxLatestResponse } from "@starboard/lib-contracts"

const TTL_MS = 10 * 60 * 1000

const cache = new Map<string, { at: number; value: FxLatestResponse }>()

type Fetch = (input: string) => Promise<Response>

/**
 * Latest FX for a quote base via the BFF (`/api/geography/fx`) — the browser
 * never calls Frankfurter directly. Session cache with a short TTL; `force`
 * bypasses it (manual refresh). Throws on any failure: callers keep their
 * previous rates and warn; rates are never invented.
 */
export async function fetchLiveFx(
  base: string,
  options: { force?: boolean; fetchImpl?: Fetch; now?: () => number } = {}
): Promise<FxLatestResponse> {
  const code = base.trim().toUpperCase()
  const now = (options.now ?? Date.now)()
  const hit = cache.get(code)
  if (!options.force && hit && now - hit.at < TTL_MS) return hit.value

  const doFetch = options.fetchImpl ?? ((input: string) => fetch(input))
  const response = await doFetch(
    `/api/geography/fx?base=${encodeURIComponent(code)}`
  )
  const body = (await response.json().catch(() => null)) as
    (Partial<FxLatestResponse> & { error?: string }) | null
  if (
    !response.ok ||
    !body ||
    typeof body.date !== "string" ||
    !body.rates ||
    typeof body.rates !== "object"
  ) {
    throw new Error(body?.error ?? "FX rates unavailable")
  }
  const value: FxLatestResponse = {
    base: code,
    date: body.date,
    rates: body.rates,
    provider: "frankfurter",
  }
  cache.set(code, { at: now, value })
  return value
}

export function clearLiveFxCache() {
  cache.clear()
}
