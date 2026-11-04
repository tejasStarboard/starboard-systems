import type { FxLatestResponse } from "@starboard/lib-contracts"

const DEFAULT_BASE_URL = "https://api.frankfurter.app"
const DEFAULT_TTL_MS = 10 * 60 * 1000
const TIMEOUT_MS = 5_000

export class FxProviderError extends Error {
  constructor(
    message: string,
    readonly status: 502 | 404 = 502
  ) {
    super(message)
    this.name = "FxProviderError"
  }
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>

/**
 * Frankfurter (ECB reference rates): HTTPS, no API key. Latest daily rate only
 * (v1: no as-of-quote-date). Server-side so the browser never calls the
 * provider; short in-memory TTL cache per base. Failures throw
 * {@link FxProviderError}; rates are never invented.
 */
export class FrankfurterClient {
  private readonly rateCache = new Map<
    string,
    { at: number; value: FxLatestResponse }
  >()
  private namesCache: { at: number; value: Record<string, string> } | null =
    null

  constructor(
    private readonly options: {
      baseUrl?: string
      ttlMs?: number
      fetchImpl?: Fetch
      now?: () => number
    } = {}
  ) {}

  private get baseUrl() {
    return (this.options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "")
  }

  private get ttlMs() {
    return this.options.ttlMs ?? DEFAULT_TTL_MS
  }

  private now() {
    return (this.options.now ?? Date.now)()
  }

  private async getJson(path: string): Promise<unknown> {
    const doFetch = this.options.fetchImpl ?? fetch
    let response: Response
    try {
      response = await doFetch(`${this.baseUrl}${path}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      throw new FxProviderError(
        `FX provider unreachable: ${error instanceof Error ? error.message : String(error)}`
      )
    }
    if (response.status === 404) {
      throw new FxProviderError("Currency not supported by FX provider", 404)
    }
    if (!response.ok) {
      throw new FxProviderError(`FX provider error (${response.status})`)
    }
    try {
      return await response.json()
    } catch {
      throw new FxProviderError("FX provider returned invalid JSON")
    }
  }

  async latest(base: string): Promise<FxLatestResponse> {
    const code = base.trim().toUpperCase()
    const hit = this.rateCache.get(code)
    if (hit && this.now() - hit.at < this.ttlMs) return hit.value

    const body = (await this.getJson(
      `/latest?from=${encodeURIComponent(code)}`
    )) as { date?: unknown; rates?: unknown }
    if (
      typeof body.date !== "string" ||
      !body.rates ||
      typeof body.rates !== "object"
    ) {
      throw new FxProviderError("FX provider returned an unexpected payload")
    }
    const rates: Record<string, number> = {}
    for (const [key, rate] of Object.entries(body.rates)) {
      if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
        rates[key.toUpperCase()] = rate
      }
    }
    const value: FxLatestResponse = {
      base: code,
      date: body.date,
      rates,
      provider: "frankfurter",
    }
    this.rateCache.set(code, { at: this.now(), value })
    return value
  }

  /** Provider currency set (`code → name`); best effort, `{}` on failure. */
  async currencies(): Promise<Record<string, string>> {
    if (this.namesCache && this.now() - this.namesCache.at < this.ttlMs) {
      return this.namesCache.value
    }
    try {
      const body = (await this.getJson("/currencies")) as Record<
        string,
        unknown
      >
      const value: Record<string, string> = {}
      for (const [code, name] of Object.entries(body)) {
        if (/^[A-Za-z]{3}$/.test(code) && typeof name === "string") {
          value[code.toUpperCase()] = name
        }
      }
      this.namesCache = { at: this.now(), value }
      return value
    } catch {
      return {}
    }
  }
}
