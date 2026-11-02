import { describe, expect, test } from "bun:test"

import {
  getContributionsForOwner,
  getContributionsToPoint,
} from "./workbench.js"
import { listManifests } from "./registry.js"

const SLOTS = [
  "quoting.slots.headerFields",
  "quoting.slots.chargeTable",
  "quoting.slots.totals",
  "quoting.slots.rateSources",
]

function off(...ids: string[]) {
  return {
    organizationId: "org-1",
    rollouts: new Map(
      ids.map((id) => [
        id,
        { mode: "off" as const, organizationIds: [] as string[] },
      ])
    ),
  }
}

describe("quoting.document defines slots (073)", () => {
  const manifests = listManifests()
  const document = manifests.find((m) => m.id === "quoting.document")!

  test("defines header / chargeTable / totals / rateSources + totalsHooks", () => {
    expect(document.defines?.extensionPoints?.map((p) => p.id)).toEqual([
      ...SLOTS,
      "quoting.totalsHooks",
    ])
  })

  test("only quoting.document defines quoting.* points", () => {
    for (const manifest of manifests.filter((m) => m.id !== document.id)) {
      expect(manifest.defines?.extensionPoints ?? []).toEqual([])
    }
  })

  test("quoting.charges contributes one charge table", () => {
    expect(
      getContributionsToPoint("quoting.slots.chargeTable", "credit").map(
        (c) => [c.id, c.extensionId]
      )
    ).toEqual([["quoting.charges.table", "quoting.charges"]])
  })

  test("catalog + spot contribute only to rateSources; spot first, catalog last", () => {
    const sources = getContributionsToPoint(
      "quoting.slots.rateSources",
      "credit"
    )
    expect(sources.map((c) => c.id)).toEqual([
      "spot.fake.source",
      "spot.maersk.source",
      "spot.cma.source",
      "rates.catalog.source",
    ])
    for (const id of [
      "rates.catalog",
      "spot.fake",
      "spot.maersk",
      "spot.cma",
    ]) {
      const manifest = manifests.find((m) => m.id === id)!
      expect(Object.keys(manifest.contributes.points ?? {})).toEqual([
        "quoting.slots.rateSources",
      ])
    }
    const spot = sources.find((c) => c.id === "spot.maersk.source")!
    expect(spot.component).toBe("rates.spotSource")
    expect(spot.props).toEqual({ carrier: "maersk" })
  })

  test("getContributionsForOwner keys every defined point, no slot names needed", () => {
    const result = getContributionsForOwner("quoting.document", "credit")
    expect(Object.keys(result)).toEqual([...SLOTS, "quoting.totalsHooks"])
    expect(result["quoting.slots.headerFields"]).toEqual([])
    expect(result["quoting.slots.chargeTable"]).toHaveLength(1)
    expect(result["quoting.slots.rateSources"]).toHaveLength(4)
  })

  test("inactive owner → no mounts (even though contributors are active)", () => {
    const context = off("quoting.document")
    expect(
      getContributionsForOwner("quoting.document", "credit", manifests, context)
    ).toEqual({})
    for (const slot of SLOTS) {
      expect(
        getContributionsToPoint(slot, "credit", manifests, context)
      ).toEqual([])
    }
  })

  test("unplugging a contributor removes only its mounts", () => {
    const context = off("quoting.charges")
    const result = getContributionsForOwner(
      "quoting.document",
      "credit",
      manifests,
      context
    )
    expect(result["quoting.slots.chargeTable"]).toEqual([])
    expect(result["quoting.slots.rateSources"]).toHaveLength(4)

    const noSpot = getContributionsForOwner(
      "quoting.document",
      "credit",
      manifests,
      off("spot.maersk", "spot.cma", "spot.fake")
    )
    expect(noSpot["quoting.slots.rateSources"]?.map((c) => c.id)).toEqual([
      "rates.catalog.source",
    ])
  })
})
