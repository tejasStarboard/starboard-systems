import { describe, expect, test } from "bun:test"

import { FrankfurterClient, FxProviderError } from "./frankfurter"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe("FrankfurterClient", () => {
  test("fetches latest, normalizes, and caches within TTL", async () => {
    let calls = 0
    let clock = 0
    const client = new FrankfurterClient({
      ttlMs: 1000,
      now: () => clock,
      fetchImpl: async (url) => {
        calls += 1
        expect(url).toBe("https://api.frankfurter.app/latest?from=USD")
        return jsonResponse({
          date: "2026-11-03",
          rates: { eur: 0.9, BAD: "x", NEG: -1 },
        })
      },
    })
    const first = await client.latest("usd")
    expect(first).toEqual({
      base: "USD",
      date: "2026-11-03",
      rates: { EUR: 0.9 },
      provider: "frankfurter",
    })
    await client.latest("USD")
    expect(calls).toBe(1)
    clock = 2000
    await client.latest("USD")
    expect(calls).toBe(2)
  })

  test("maps failures to FxProviderError without inventing rates", async () => {
    const down = new FrankfurterClient({
      fetchImpl: async () => {
        throw new Error("offline")
      },
    })
    await expect(down.latest("USD")).rejects.toBeInstanceOf(FxProviderError)

    const unsupported = new FrankfurterClient({
      fetchImpl: async () => jsonResponse({}, 404),
    })
    await expect(unsupported.latest("ZZZ")).rejects.toMatchObject({
      status: 404,
    })

    const bad = new FrankfurterClient({
      fetchImpl: async () => jsonResponse({ nope: true }),
    })
    await expect(bad.latest("USD")).rejects.toBeInstanceOf(FxProviderError)
  })

  test("currencies is best effort", async () => {
    const ok = new FrankfurterClient({
      fetchImpl: async () => jsonResponse({ USD: "United States Dollar" }),
    })
    expect(await ok.currencies()).toEqual({ USD: "United States Dollar" })
    const down = new FrankfurterClient({
      fetchImpl: async () => jsonResponse({}, 500),
    })
    expect(await down.currencies()).toEqual({})
  })
})
