import { describe, expect, test } from "bun:test"

import { mergePortInto, mergePortOption } from "./port-merge"

const api = {
  value: "CNSHA",
  label: "CNSHA — Shanghai",
  country: "CN",
  latitude: 31.23,
  longitude: 121.47,
}

describe("port-merge", () => {
  test("seed {value,label} does not wipe API lat/lng", () => {
    const merged = mergePortOption(api, {
      value: "CNSHA",
      label: "CNSHA — Shanghai (seed)",
    })
    expect(merged.latitude).toBe(31.23)
    expect(merged.longitude).toBe(121.47)
    expect(merged.country).toBe("CN")
    expect(merged.label).toBe("CNSHA — Shanghai (seed)")
  })

  test("null geo on the override keeps existing coords", () => {
    const merged = mergePortOption(api, {
      value: "CNSHA",
      label: api.label,
      latitude: null,
      longitude: null,
    })
    expect(merged.latitude).toBe(31.23)
  })

  test("override adds coords when base had none", () => {
    expect(mergePortOption({ value: "CNSHA", label: "x" }, api).latitude).toBe(
      31.23
    )
  })

  test("mergePortInto preserves existing entry geo", () => {
    const map = new Map([[api.value, api]])
    mergePortInto(map, { value: "CNSHA", label: "seed" })
    expect(map.get("CNSHA")?.longitude).toBe(121.47)
  })
})
