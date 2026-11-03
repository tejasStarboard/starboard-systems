import { beforeEach, describe, expect, test } from "bun:test"

import { clearLiveFxCache, fetchLiveFx } from "./live-fx"

function ok(rates: Record<string, number>) {
  return new Response(
    JSON.stringify({
      base: "USD",
      date: "2026-11-03",
      rates,
      provider: "frankfurter",
    })
  )
}

describe("fetchLiveFx", () => {
  beforeEach(() => clearLiveFxCache())

  test("calls the BFF route and caches within the TTL", async () => {
    const urls: string[] = []
    const fetchImpl = async (url: string) => {
      urls.push(url)
      return ok({ EUR: 0.9 })
    }
    const first = await fetchLiveFx("usd", { fetchImpl })
    await fetchLiveFx("USD", { fetchImpl })
    expect(urls).toEqual(["/api/geography/fx?base=USD"])
    expect(first.rates).toEqual({ EUR: 0.9 })
  })

  test("force bypasses the cache; TTL expiry refetches", async () => {
    let calls = 0
    let clock = 0
    const fetchImpl = async () => {
      calls += 1
      return ok({ EUR: 0.9 })
    }
    const now = () => clock
    await fetchLiveFx("USD", { fetchImpl, now })
    await fetchLiveFx("USD", { fetchImpl, now, force: true })
    expect(calls).toBe(2)
    clock = 11 * 60 * 1000
    await fetchLiveFx("USD", { fetchImpl, now })
    expect(calls).toBe(3)
  })

  test("failure throws and does not poison the cache", async () => {
    await expect(
      fetchLiveFx("USD", {
        fetchImpl: async () =>
          new Response(JSON.stringify({ error: "down" }), { status: 502 }),
      })
    ).rejects.toThrow("down")
    const value = await fetchLiveFx("USD", {
      fetchImpl: async () => ok({ EUR: 0.9 }),
    })
    expect(value.rates.EUR).toBe(0.9)
  })
})
