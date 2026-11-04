import { describe, expect, test } from "bun:test"

import { peekPortGeoCache, rememberPort } from "./use-port-geo"

describe("rememberPort", () => {
  test("keeps cached lat/lng when a later option omits them", () => {
    rememberPort({
      value: "CNSHA",
      label: "CNSHA — Shanghai",
      country: "CN",
      latitude: 31.23,
      longitude: 121.47,
    })
    rememberPort({ value: "CNSHA", label: "CNSHA — Shanghai" })
    const hit = peekPortGeoCache().get("CNSHA")
    expect(hit?.latitude).toBe(31.23)
    expect(hit?.longitude).toBe(121.47)
    expect(hit?.country).toBe("CN")
  })
})
