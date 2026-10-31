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
    const manifests = listManifests().map((manifest) => ({
      ...manifest,
      enabled: false,
    }))
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

  test("enabled ingestion.fcl_v6 contributes rates.upload for credit plan", () => {
    const contributions = getActiveContributions("credit", listManifests())
    expect(contributions.uiSlots).toContain("rates.upload")
    expect(
      contributions.nav.some((item) => item.href === "/rates/upload")
    ).toBe(true)
    expect(
      contributions.api.some((item) =>
        item.pathPrefix.includes("ingestion.fcl_v6")
      )
    ).toBe(true)
  })

  test("enabled messaging.msgraph contributes inbox only on enterprise", () => {
    const onCredit = getActiveContributions("credit", listManifests())
    expect(onCredit.uiSlots).not.toContain("messaging.inbox")
    expect(onCredit.nav.some((item) => item.href === "/messaging/inbox")).toBe(
      false
    )

    const onEnterprise = getActiveContributions("enterprise", listManifests())
    expect(onEnterprise.uiSlots).toContain("messaging.inbox")
    expect(
      onEnterprise.nav.some((item) => item.href === "/messaging/inbox")
    ).toBe(true)
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

  test("enabled spot.fake contributes quote.rateSources and spot.search for credit", () => {
    const contributions = getActiveContributions("credit", listManifests())
    expect(contributions.uiSlots).toContain("quote.rateSources")
    expect(
      contributions.jobs.some(
        (job) => job.type === "spot.search" && job.carrier === "fake"
      )
    ).toBe(true)
    expect(
      contributions.api.some((item) => item.pathPrefix.includes("spot.fake"))
    ).toBe(true)
    expect(
      listActiveExtensions("credit", listManifests()).some(
        (m) => m.id === "spot.fake"
      )
    ).toBe(true)
  })

  test("enabled spot.maersk contributes quote.rateSources and spot.search for credit", () => {
    const contributions = getActiveContributions("credit", listManifests())
    expect(
      contributions.jobs.some(
        (job) => job.type === "spot.search" && job.carrier === "maersk"
      )
    ).toBe(true)
    expect(
      contributions.api.some((item) => item.pathPrefix.includes("spot.maersk"))
    ).toBe(true)
    expect(
      listActiveExtensions("credit", listManifests()).some(
        (m) => m.id === "spot.maersk"
      )
    ).toBe(true)
  })
})
