import { describe, expect, test } from "bun:test"

import { isActive } from "./entitlements.js"
import { extensionManifestSchema, type ExtensionManifest } from "./manifest.js"
import { listManifests } from "./registry.js"
import { validateManifestSet } from "./validate.js"
import {
  getActiveWorkbenchContributions,
  getContributionsToPoint,
  resolveActivePointOwner,
  resolvePointOwner,
} from "./workbench.js"

function manifest(
  overrides: Partial<ExtensionManifest> & { id: string }
): ExtensionManifest {
  return extensionManifestSchema.parse({
    version: "0.0.0",
    displayName: overrides.id,
    requiredPlan: ["credit", "enterprise"],
    contributes: {},
    enabled: true,
    ...overrides,
  })
}

const owner = manifest({
  id: "quoting.document",
  defines: {
    extensionPoints: [
      { id: "quoting.slots.chargeTable", description: "Charge grid" },
    ],
  },
  contributes: {
    activity: [{ id: "quotes", label: "Quotes", icon: "file-text" }],
    views: [
      {
        id: "quotes.list",
        name: "Quotes",
        activityId: "quotes",
        entries: [{ id: "all", label: "All quotes", href: "/" }],
      },
    ],
    editors: [{ viewType: "quote", displayName: "Quote" }],
    commands: [{ id: "quote.new", title: "New quote" }],
  },
})

const contributor = manifest({
  id: "quoting.charges",
  contributes: {
    points: {
      "quoting.slots.chargeTable": [{ id: "charges.grid" }],
      "quoting.slots.undefinedPoint": [{ id: "orphan" }],
    },
  },
})

describe("manifest schema", () => {
  test("parses workbench contributions and defines", () => {
    expect(owner.defines?.extensionPoints?.[0]?.id).toBe(
      "quoting.slots.chargeTable"
    )
    expect(owner.contributes.editors?.[0]?.viewType).toBe("quote")
    expect(
      contributor.contributes.points?.["quoting.slots.chargeTable"]
    ).toEqual([{ id: "charges.grid" }])
  })

  test("legacy manifests without new fields still parse", () => {
    for (const registered of listManifests()) {
      expect(extensionManifestSchema.safeParse(registered).success).toBe(true)
    }
    const legacy = manifest({
      id: "legacy.thing",
      contributes: {
        nav: [{ id: "x", label: "X", href: "/x" }],
        uiSlots: ["rates.upload"],
      },
    })
    expect(legacy.defines).toBeUndefined()
    expect(legacy.contributes.nav).toHaveLength(1)
  })

  test("rejects invalid shapes", () => {
    const base = {
      id: "bad",
      version: "0.0.0",
      displayName: "Bad",
      requiredPlan: ["credit"],
    }
    expect(
      extensionManifestSchema.safeParse({
        ...base,
        contributes: { views: [{ id: "v", name: "V" }] },
      }).success
    ).toBe(false)
    expect(
      extensionManifestSchema.safeParse({
        ...base,
        contributes: {},
        defines: { extensionPoints: [{ id: "workbench.views" }] },
      }).success
    ).toBe(false)
    expect(
      extensionManifestSchema.safeParse({
        ...base,
        contributes: {},
        defines: { extensionPoints: [{ id: "a.b" }, { id: "a.b" }] },
      }).success
    ).toBe(false)
    expect(
      extensionManifestSchema.safeParse({
        ...base,
        contributes: { points: { "workbench.views": [{ id: "x" }] } },
      }).success
    ).toBe(false)
  })
})

describe("manifest set validation", () => {
  test("rejects two owners of the same point and duplicate ids", () => {
    const rival = manifest({
      id: "rival",
      defines: { extensionPoints: [{ id: "quoting.slots.chargeTable" }] },
    })
    expect(validateManifestSet([owner, rival])).toHaveLength(1)
    expect(validateManifestSet([owner, owner])).toContain(
      'Duplicate extension id "quoting.document"'
    )
    expect(validateManifestSet([owner, contributor])).toEqual([])
  })
})

describe("point ownership", () => {
  test("resolves owner; unknown and ambiguous points have none", () => {
    expect(
      resolvePointOwner("quoting.slots.chargeTable", [owner, contributor])?.id
    ).toBe("quoting.document")
    expect(resolvePointOwner("nope", [owner, contributor])).toBeNull()

    const rival = manifest({
      id: "rival",
      defines: { extensionPoints: [{ id: "quoting.slots.chargeTable" }] },
    })
    expect(
      resolvePointOwner("quoting.slots.chargeTable", [owner, rival])
    ).toBeNull()
  })

  test("active owner requires activation", () => {
    const disabled = { ...owner, enabled: false }
    expect(
      resolveActivePointOwner("quoting.slots.chargeTable", "credit", [
        disabled,
        contributor,
      ])
    ).toBeNull()
    expect(
      resolveActivePointOwner("quoting.slots.chargeTable", "credit", [
        owner,
        contributor,
      ])?.id
    ).toBe("quoting.document")
  })
})

describe("getContributionsToPoint", () => {
  test("returns contributions tagged with contributor when owner active", () => {
    expect(
      getContributionsToPoint("quoting.slots.chargeTable", "credit", [
        owner,
        contributor,
      ])
    ).toEqual([{ id: "charges.grid", extensionId: "quoting.charges" }])
  })

  test("fails closed when owner is disabled", () => {
    expect(
      getContributionsToPoint("quoting.slots.chargeTable", "credit", [
        { ...owner, enabled: false },
        contributor,
      ])
    ).toEqual([])
  })

  test("fails closed when owner is not entitled", () => {
    const enterpriseOwner = { ...owner, requiredPlan: ["enterprise" as const] }
    expect(
      getContributionsToPoint("quoting.slots.chargeTable", "credit", [
        enterpriseOwner,
        contributor,
      ])
    ).toEqual([])
    expect(
      getContributionsToPoint("quoting.slots.chargeTable", "enterprise", [
        enterpriseOwner,
        contributor,
      ])
    ).toHaveLength(1)
  })

  test("fails closed when owner rollout is off, even though contributor is on", () => {
    const rollouts = new Map([
      ["quoting.document", { mode: "off" as const, organizationIds: [] }],
    ])
    const context = { organizationId: "org-1", rollouts }
    expect(isActive(contributor, "credit", context)).toBe(true)
    expect(
      getContributionsToPoint(
        "quoting.slots.chargeTable",
        "credit",
        [owner, contributor],
        context
      )
    ).toEqual([])
  })

  test("fails closed for undefined points and inactive contributors", () => {
    expect(
      getContributionsToPoint("quoting.slots.undefinedPoint", "credit", [
        owner,
        contributor,
      ])
    ).toEqual([])
    expect(
      getContributionsToPoint("quoting.slots.chargeTable", "credit", [
        owner,
        { ...contributor, enabled: false },
      ])
    ).toEqual([])
  })
})

describe("getActiveWorkbenchContributions", () => {
  test("lists kernel-point contributions and defined-point contributions", () => {
    const result = getActiveWorkbenchContributions("credit", [
      owner,
      contributor,
    ])
    expect(result.activity).toEqual([
      {
        id: "quotes",
        label: "Quotes",
        icon: "file-text",
        extensionId: "quoting.document",
      },
    ])
    expect(result.views.map((view) => view.id)).toEqual(["quotes.list"])
    expect(result.editors.map((editor) => editor.viewType)).toEqual(["quote"])
    expect(result.commands.map((command) => command.id)).toEqual(["quote.new"])
    expect(Object.keys(result.points)).toEqual(["quoting.slots.chargeTable"])
  })

  test("inactive owner drops its own contributions and nested points", () => {
    const result = getActiveWorkbenchContributions("credit", [
      { ...owner, enabled: false },
      contributor,
    ])
    expect(result.activity).toEqual([])
    expect(result.views).toEqual([])
    expect(result.editors).toEqual([])
    expect(result.commands).toEqual([])
    expect(result.points).toEqual({})
  })

  test("drops views whose activity is not contributed by an active extension", () => {
    const orphan = manifest({
      id: "orphan.views",
      contributes: {
        views: [{ id: "orphan.list", name: "Orphan", activityId: "missing" }],
      },
    })
    const result = getActiveWorkbenchContributions("credit", [owner, orphan])
    expect(result.views.map((view) => view.id)).toEqual(["quotes.list"])
    // activity owner inactive → its views and a sibling's views for it vanish
    const sibling = manifest({
      id: "sibling",
      contributes: {
        views: [{ id: "sib.list", name: "Sib", activityId: "quotes" }],
      },
    })
    expect(
      getActiveWorkbenchContributions("credit", [
        { ...owner, enabled: false },
        sibling,
      ]).views
    ).toEqual([])
  })

  test("first registered wins on duplicate ids", () => {
    const dup = manifest({
      id: "dup",
      contributes: {
        editors: [{ viewType: "quote", displayName: "Other quote" }],
      },
    })
    const result = getActiveWorkbenchContributions("credit", [owner, dup])
    expect(result.editors).toHaveLength(1)
    expect(result.editors[0]?.extensionId).toBe("quoting.document")
  })

  test("current stub registry contributes nothing to the workbench", () => {
    const result = getActiveWorkbenchContributions("enterprise")
    expect(result.activity).toEqual([])
    expect(result.points).toEqual({})
  })
})
