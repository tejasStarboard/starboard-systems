import { describe, expect, test } from "bun:test"

import { builtinManifests } from "./builtins.js"
import { isActive, listActiveExtensions } from "./entitlements.js"
import { extensionManifestSchema } from "./manifest.js"
import { listManifests } from "./registry.js"
import { getActiveWorkbenchContributions } from "./workbench.js"

const BUILTIN_IDS = [
  "quoting.document",
  "quoting.charges",
  "crm.parties",
  "geo.gazetteer",
  "rates.catalog",
  "org.settings",
]

const OPTIONAL_IDS = [
  "ingestion.fcl_v6",
  "messaging.msgraph",
  "spot.fake",
  "spot.maersk",
  "spot.cma",
]

describe("driving built-in manifests (076)", () => {
  test("all six ids are registered and schema-valid", () => {
    expect(
      builtinManifests.map((m) => extensionManifestSchema.parse(m).id)
    ).toEqual(BUILTIN_IDS)
    const ids = listManifests().map((m) => m.id)
    for (const id of [...BUILTIN_IDS, ...OPTIONAL_IDS]) {
      expect(ids).toContain(id)
    }
  })

  test("default-on for credit and enterprise (missing rollout row = on)", () => {
    for (const plan of ["credit", "enterprise"] as const) {
      const active = listActiveExtensions(plan).map((m) => m.id)
      for (const id of BUILTIN_IDS) expect(active).toContain(id)
    }
  })

  test("rollout off hides every built-in (unplug)", () => {
    const rollouts = new Map(
      BUILTIN_IDS.map((id) => [
        id,
        { mode: "off" as const, organizationIds: [] as string[] },
      ])
    )
    const manifests = listManifests()
    const context = { organizationId: "org-1", rollouts }
    for (const manifest of manifests.filter((m) =>
      BUILTIN_IDS.includes(m.id)
    )) {
      expect(isActive(manifest, "enterprise", context)).toBe(false)
    }
    const contributions = getActiveWorkbenchContributions(
      "enterprise",
      manifests,
      context
    )
    expect(contributions.editors).toEqual([])
    expect(contributions.views).toEqual([])
    expect(contributions.activity).toEqual([])
  })

  test("quoting.document contributes stub Quotes view + quote editor", () => {
    const contributions = getActiveWorkbenchContributions("credit")
    expect(contributions.activity.map((a) => a.id)).toEqual(["quotes"])
    const view = contributions.views.find(
      (v) => v.id === "quoting.document.stub"
    )
    expect(view?.extensionId).toBe("quoting.document")
    expect(view?.entries?.[0]?.opens).toEqual({
      viewType: "quote.stub",
      resourceId: "stub-1",
      title: "Stub quote",
    })
    expect(contributions.editors.map((e) => e.viewType)).toEqual(["quote.stub"])
  })

  test("optional extensions keep their nav / slots", () => {
    const manifests = listManifests()
    const byId = (id: string) => manifests.find((m) => m.id === id)!
    expect(byId("ingestion.fcl_v6").contributes.nav?.[0]?.href).toBe(
      "/rates/upload"
    )
    expect(byId("messaging.msgraph").contributes.nav?.[0]?.href).toBe(
      "/messaging/inbox"
    )
    expect(byId("spot.fake").contributes.uiSlots).toEqual(["quote.rateSources"])
    for (const id of OPTIONAL_IDS) {
      expect(byId(id).worker?.kind).toBe("python-temporal")
    }
  })

  test("view entries need exactly one of href or opens", () => {
    const base = {
      id: "x",
      version: "0.0.0",
      displayName: "x",
      requiredPlan: ["credit"],
    }
    const withEntry = (entry: object) =>
      extensionManifestSchema.safeParse({
        ...base,
        contributes: {
          views: [{ id: "v", name: "V", activityId: "a", entries: [entry] }],
        },
      }).success
    expect(withEntry({ id: "e", label: "E" })).toBe(false)
    expect(
      withEntry({
        id: "e",
        label: "E",
        href: "/x",
        opens: { viewType: "t", resourceId: "r" },
      })
    ).toBe(false)
    expect(withEntry({ id: "e", label: "E", href: "/x" })).toBe(true)
  })
})
