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
  "quoting.slots.preview",
  "quoting.slots.laneRoute",
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

  test("defines header / chargeTable / totals / rateSources / lifecycle / preview / commands + totalsHooks", () => {
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

  test("quoting.pdf + quoting.email contribute preview tabs (092)", () => {
    expect(
      getContributionsToPoint("quoting.slots.preview", "credit").map((c) => [
        c.id,
        c.extensionId,
        c.props?.tab,
      ])
    ).toEqual([
      ["quoting.pdf.preview", "quoting.pdf", "pdf"],
      ["quoting.email.preview", "quoting.email", "email"],
    ])
  })

  test("quoting.incoterm contributes header fields (084)", () => {
    expect(
      getContributionsToPoint("quoting.slots.headerFields", "credit").map(
        (c) => [c.id, c.extensionId]
      )
    ).toEqual([["quoting.incoterm.fields", "quoting.incoterm"]])
  })

  test("geo.gazetteer contributes the FCL route map (090)", () => {
    expect(
      getContributionsToPoint("quoting.slots.laneRoute", "credit").map((c) => [
        c.id,
        c.extensionId,
      ])
    ).toEqual([["geo.gazetteer.routeMap", "geo.gazetteer"]])
  })

  test("unplug geo.gazetteer → empty laneRoute (Route falls back to PortCombobox)", () => {
    const result = getContributionsForOwner(
      "quoting.document",
      "credit",
      manifests,
      off("geo.gazetteer")
    )
    expect(result["quoting.slots.laneRoute"]).toEqual([])
    expect(result["quoting.slots.headerFields"]).toHaveLength(1)
  })

  test("quoting.markup contributes totals footer (084)", () => {
    expect(
      getContributionsToPoint("quoting.slots.totals", "credit").map((c) => [
        c.id,
        c.extensionId,
      ])
    ).toEqual([["quoting.markup.footer", "quoting.markup"]])
  })

  test("quoting.document owns the slots; pdf/email own only their template points (094)", () => {
    const owned: Record<string, string[]> = {
      "quoting.pdf": ["quoting.pdf.templates"],
      "quoting.email": ["quoting.email.templates"],
    }
    for (const manifest of manifests.filter((m) => m.id !== document.id)) {
      const quotingDefines = (manifest.defines?.extensionPoints ?? [])
        .map((point) => point.id)
        .filter((id) => id.startsWith("quoting."))
      expect(quotingDefines).toEqual(owned[manifest.id] ?? [])
    }
  })

  test("template points self-contribute default + letterhead, org-pickable (094)", () => {
    expect(
      getContributionsToPoint("quoting.pdf.templates", "credit").map((c) => [
        c.id,
        c.extensionId,
      ])
    ).toEqual([
      ["quoting.pdf.template.standard", "quoting.pdf"],
      ["quoting.pdf.template.letterhead", "quoting.pdf"],
    ])
    expect(
      getContributionsToPoint("quoting.email.templates", "credit").map(
        (c) => c.id
      )
    ).toEqual([
      "quoting.email.template.standard",
      "quoting.email.template.letterhead",
    ])
  })

  test("unplug quoting.pdf / quoting.email → their template points go empty (094)", () => {
    expect(
      getContributionsToPoint(
        "quoting.pdf.templates",
        "credit",
        manifests,
        off("quoting.pdf")
      )
    ).toEqual([])
    expect(
      getContributionsToPoint(
        "quoting.email.templates",
        "credit",
        manifests,
        off("quoting.email")
      )
    ).toEqual([])
    expect(
      getContributionsToPoint(
        "quoting.pdf.templates",
        "credit",
        manifests,
        off("quoting.email")
      )
    ).toHaveLength(2)
  })

  test("rates.catalog defines ingestActions for 086/087", () => {
    const catalog = manifests.find((m) => m.id === "rates.catalog")!
    expect(catalog.defines?.extensionPoints?.map((p) => p.id)).toEqual([
      "rates.slots.ingestActions",
    ])
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
    // PDF tab contributor gone; Email tab contributor stays (092).
    expect(result["quoting.slots.preview"]?.map((c) => c.id)).toEqual([
      "quoting.email.preview",
    ])
    expect(result["quoting.slots.lifecycle"]).toHaveLength(1)
    expect(result["quoting.slots.chargeTable"]).toHaveLength(1)
  })

  test("unplug quoting.email → no email preview; PDF + export intact (092)", () => {
    const result = getContributionsForOwner(
      "quoting.document",
      "credit",
      manifests,
      off("quoting.email")
    )
    expect(result["quoting.slots.preview"]?.map((c) => c.id)).toEqual([
      "quoting.pdf.preview",
    ])
    expect(result["quoting.commands"]).toHaveLength(1)
    expect(result["quoting.slots.lifecycle"]).toHaveLength(1)
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
  })
})
