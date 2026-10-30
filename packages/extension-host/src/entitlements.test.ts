import { describe, expect, test } from "bun:test"

import {
  getActiveContributions,
  isEntitled,
  listActiveExtensions,
} from "./entitlements.js"
import type { ExtensionManifest } from "./manifest.js"
import { listManifests } from "./registry.js"

const enterpriseOnlyEnabled: ExtensionManifest = {
  id: "messaging.msgraph",
  version: "0.0.0",
  displayName: "Microsoft Graph email",
  requiredPlan: ["enterprise"],
  contributes: {
    nav: [{ id: "inbox", label: "Inbox", href: "/messaging/inbox" }],
  },
  enabled: true,
}

const creditEnabled: ExtensionManifest = {
  id: "spot.maersk",
  version: "0.0.0",
  displayName: "Maersk spot rates",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    uiSlots: ["quote.rateSources"],
    jobs: [{ type: "spot.search", carrier: "maersk" }],
  },
  enabled: true,
}

describe("entitlement filter", () => {
  test("enterprise-only stub is excluded on credit and included on enterprise when enabled", () => {
    expect(isEntitled(enterpriseOnlyEnabled, "credit")).toBe(false)
    expect(isEntitled(enterpriseOnlyEnabled, "enterprise")).toBe(true)

    const onCredit = listActiveExtensions("credit", [enterpriseOnlyEnabled])
    expect(onCredit).toHaveLength(0)

    const onEnterprise = listActiveExtensions("enterprise", [
      enterpriseOnlyEnabled,
    ])
    expect(onEnterprise.map((m) => m.id)).toEqual(["messaging.msgraph"])
  })

  test("disabled registry stubs are excluded from active contributions even when plan matches", () => {
    const manifests = listManifests()
    expect(manifests.every((m) => m.enabled === false)).toBe(true)

    const creditCapable = manifests.filter((m) =>
      m.requiredPlan.includes("credit")
    )
    expect(creditCapable.length).toBeGreaterThan(0)

    expect(listActiveExtensions("credit", manifests)).toHaveLength(0)
    expect(listActiveExtensions("enterprise", manifests)).toHaveLength(0)

    const contributions = getActiveContributions("credit", manifests)
    expect(contributions.nav).toHaveLength(0)
    expect(contributions.jobs).toHaveLength(0)
    expect(contributions.api).toHaveLength(0)
    expect(contributions.uiSlots).toHaveLength(0)
  })

  test("enabled entitled extensions contribute nav and slots", () => {
    const contributions = getActiveContributions("credit", [
      enterpriseOnlyEnabled,
      creditEnabled,
    ])

    expect(contributions.nav).toHaveLength(0)
    expect(contributions.uiSlots).toEqual(["quote.rateSources"])
    expect(contributions.jobs).toEqual([
      { type: "spot.search", carrier: "maersk" },
    ])
  })
})
