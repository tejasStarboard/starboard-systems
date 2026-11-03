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
  "quoting.slots.lifecycle",
  "quoting.commands",
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

  test("defines header / chargeTable / totals / rateSources / lifecycle / commands + totalsHooks", () => {
    expect(document.defines?.extensionPoints?.map((p) => p.id)).toEqual([
      ...SLOTS,
      "quoting.totalsHooks",
    ])
  })

  test("self-contributes lifecycle chrome (082)", () => {
    expect(
      getContributionsToPoint("quoting.slots.lifecycle", "credit").map((c) => [
        c.id,
        c.extensionId,
      ])
    ).toEqual([["quoting.document.lifecycle", "quoting.document"]])
  })

  test("quoting.pdf contributes Export PDF to quoting.commands (083)", () => {
    expect(
      getContributionsToPoint("quoting.commands", "credit").map((c) => [
        c.id,
        c.extensionId,
      ])
    ).toEqual([["quoting.pdf.export", "quoting.pdf"]])
  })

  test("quoting.incoterm contributes header fields (084)", () => {
    expect(
      getContributionsToPoint("quoting.slots.headerFields", "credit").map(
        (c) => [c.id, c.extensionId]
      )
    ).toEqual([["quoting.incoterm.fields", "quoting.incoterm"]])
  })

  test("quoting.markup contributes totals footer (084)", () => {
    expect(
      getContributionsToPoint("quoting.slots.totals", "credit").map((c) => [
        c.id,
        c.extensionId,
      ])
    ).toEqual([["quoting.markup.footer", "quoting.markup"]])
  })

  test("only quoting.document defines quoting.* points", () => {
    for (const manifest of manifests.filter((m) => m.id !== document.id)) {
      const quotingDefines = (manifest.defines?.extensionPoints ?? []).filter(
        (point) => point.id.startsWith("quoting.")
      )
      expect(quotingDefines).toEqual([])
    }
  })

  test("rates.catalog defines ingestActions + spotSearch", () => {
    const catalog = manifests.find((m) => m.id === "rates.catalog")!
    expect(catalog.defines?.extensionPoints?.map((p) => p.id)).toEqual([
      "rates.slots.ingestActions",
      "rates.slots.spotSearch",
    ])
  })

  test("quoting.charges contributes one charge table", () => {
    expect(
      getContributionsToPoint("quoting.slots.chargeTable", "credit").map(
        (c) => [c.id, c.extensionId]
      )
    ).toEqual([["quoting.charges.table", "quoting.charges"]])
  })

  test("catalog + spot contribute to rateSources; spot also to spotSearch", () => {
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
    expect(
      Object.keys(
        manifests.find((m) => m.id === "rates.catalog")!.contributes.points ??
          {}
      )
    ).toEqual(["quoting.slots.rateSources"])
    for (const id of ["spot.fake", "spot.maersk", "spot.cma"]) {
      const manifest = manifests.find((m) => m.id === id)!
      expect(Object.keys(manifest.contributes.points ?? {}).sort()).toEqual([
        "quoting.slots.rateSources",
        "rates.slots.spotSearch",
      ])
    }
    const spot = sources.find((c) => c.id === "spot.maersk.source")!
    expect(spot.component).toBe("rates.spotSource")
    expect(spot.props).toEqual({ carrier: "maersk" })

    const spotSearch = getContributionsToPoint(
      "rates.slots.spotSearch",
      "credit"
    )
    expect(spotSearch.map((c) => c.id)).toEqual([
      "spot.fake.spotSearch",
      "spot.maersk.spotSearch",
      "spot.cma.spotSearch",
    ])
    expect(spotSearch.every((c) => c.component === "rates.spotSource")).toBe(
      true
    )
  })

  test("getContributionsForOwner keys every defined point, no slot names needed", () => {
    const result = getContributionsForOwner("quoting.document", "credit")
    expect(Object.keys(result)).toEqual([...SLOTS, "quoting.totalsHooks"])
    expect(result["quoting.slots.headerFields"]).toHaveLength(1)
    expect(result["quoting.slots.totals"]).toHaveLength(1)
    expect(result["quoting.slots.chargeTable"]).toHaveLength(1)
    expect(result["quoting.slots.rateSources"]).toHaveLength(4)
    expect(result["quoting.slots.lifecycle"]).toHaveLength(1)
    expect(result["quoting.commands"]).toHaveLength(1)
  })

  test("unplug quoting.pdf → no export command; other slots intact", () => {
    const context = off("quoting.pdf")
    const result = getContributionsForOwner(
      "quoting.document",
      "credit",
      manifests,
      context
    )
    expect(result["quoting.commands"]).toEqual([])
    expect(result["quoting.slots.lifecycle"]).toHaveLength(1)
    expect(result["quoting.slots.chargeTable"]).toHaveLength(1)
  })

  test("unplug quoting.incoterm → empty headerFields; other slots intact", () => {
    const result = getContributionsForOwner(
      "quoting.document",
      "credit",
      manifests,
      off("quoting.incoterm")
    )
    expect(result["quoting.slots.headerFields"]).toEqual([])
    expect(result["quoting.slots.totals"]).toHaveLength(1)
    expect(result["quoting.slots.chargeTable"]).toHaveLength(1)
  })

  test("unplug quoting.markup → empty totals; other slots intact", () => {
    const result = getContributionsForOwner(
      "quoting.document",
      "credit",
      manifests,
      off("quoting.markup")
    )
    expect(result["quoting.slots.totals"]).toEqual([])
    expect(result["quoting.slots.headerFields"]).toHaveLength(1)
    expect(result["quoting.slots.chargeTable"]).toHaveLength(1)
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

    const ratesNoSpot = getContributionsForOwner(
      "rates.catalog",
      "credit",
      manifests,
      off("spot.maersk", "spot.cma", "spot.fake")
    )
    expect(ratesNoSpot["rates.slots.spotSearch"]).toEqual([])
    expect(ratesNoSpot["rates.slots.ingestActions"]).toHaveLength(1)
  })

  test("rates.catalog owner exposes spotSearch contributions when spot on", () => {
    const result = getContributionsForOwner("rates.catalog", "credit")
    expect(Object.keys(result)).toEqual([
      "rates.slots.ingestActions",
      "rates.slots.spotSearch",
    ])
    expect(result["rates.slots.spotSearch"]?.map((c) => c.id)).toEqual([
      "spot.fake.spotSearch",
      "spot.maersk.spotSearch",
      "spot.cma.spotSearch",
    ])
  })
})
