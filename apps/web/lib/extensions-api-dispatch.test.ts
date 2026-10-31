import { describe, expect, test } from "bun:test"

import { matchExtensionRoute } from "./extensions-route-match"

describe("matchExtensionRoute", () => {
  test("maps spot enqueue and status paths", () => {
    expect(matchExtensionRoute("spot", "POST", ["jobs"])).toBe("spot.enqueue")
    expect(matchExtensionRoute("spot", "GET", ["jobs", "wf-1"])).toBe(
      "spot.status"
    )
    expect(matchExtensionRoute("spot", "GET", ["jobs"])).toBeNull()
  })

  test("maps ingestion enqueue and status paths", () => {
    expect(matchExtensionRoute("ingestion", "POST", ["jobs"])).toBe(
      "ingestion.enqueue"
    )
    expect(matchExtensionRoute("ingestion", "GET", ["jobs", "wf-9"])).toBe(
      "ingestion.status"
    )
  })

  test("maps messaging connection and jobs", () => {
    expect(matchExtensionRoute("messaging", "GET", ["connection"])).toBe(
      "messaging.connection.get"
    )
    expect(matchExtensionRoute("messaging", "POST", ["jobs"])).toBe(
      "messaging.enqueue"
    )
    expect(matchExtensionRoute("messaging", "POST", ["unknown"])).toBeNull()
  })

  test("unknown extension service returns null", () => {
    expect(matchExtensionRoute("unknown", "POST", ["jobs"])).toBeNull()
  })
})
