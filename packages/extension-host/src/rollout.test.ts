import { describe, expect, test } from "bun:test"

import {
  getActiveContributions,
  isActive,
  listActiveExtensions,
} from "./entitlements.js"
import type { ExtensionManifest } from "./manifest.js"
import type { ExtensionRolloutState } from "./rollout.js"
import { isRolloutAllowed } from "./rollout.js"

const entitled: ExtensionManifest = {
  id: "spot.fake",
  version: "0.0.0",
  displayName: "Fake",
  requiredPlan: ["credit", "enterprise"],
  contributes: { uiSlots: ["quote.rateSources"] },
  enabled: true,
}

const enterpriseOnly: ExtensionManifest = {
  id: "messaging.msgraph",
  version: "0.0.0",
  displayName: "Graph",
  requiredPlan: ["enterprise"],
  contributes: { uiSlots: ["messaging.inbox"] },
  enabled: true,
}

describe("isRolloutAllowed", () => {
  test("missing state is allowed (default on)", () => {
    expect(isRolloutAllowed(undefined, "org-a")).toBe(true)
  })

  test("off blocks all orgs", () => {
    expect(
      isRolloutAllowed({ mode: "off", organizationIds: [] }, "org-a")
    ).toBe(false)
  })

  test("on allows all orgs", () => {
    expect(isRolloutAllowed({ mode: "on", organizationIds: [] }, "org-a")).toBe(
      true
    )
  })

  test("beta allows only listed orgs", () => {
    const beta: ExtensionRolloutState = {
      mode: "beta",
      organizationIds: ["org-a"],
    }
    expect(isRolloutAllowed(beta, "org-a")).toBe(true)
    expect(isRolloutAllowed(beta, "org-b")).toBe(false)
  })

  test("common allows only resolved common-list orgs", () => {
    const common: ExtensionRolloutState = {
      mode: "common",
      organizationIds: ["org-shared"],
    }
    expect(isRolloutAllowed(common, "org-shared")).toBe(true)
    expect(isRolloutAllowed(common, "org-other")).toBe(false)
  })
})

describe("rollout × entitlement matrix", () => {
  const orgA = "org-a"
  const rollouts = new Map<string, ExtensionRolloutState>([
    ["spot.fake", { mode: "beta", organizationIds: [orgA] }],
    ["messaging.msgraph", { mode: "on", organizationIds: [] }],
  ])

  test("disabled mode excludes entitled org", () => {
    const off = new Map<string, ExtensionRolloutState>([
      ["spot.fake", { mode: "off", organizationIds: [] }],
    ])
    expect(
      isActive(entitled, "credit", {
        organizationId: orgA,
        rollouts: off,
      })
    ).toBe(false)
  })

  test("beta org + entitled plan is active", () => {
    expect(
      isActive(entitled, "credit", {
        organizationId: orgA,
        rollouts,
      })
    ).toBe(true)
  })

  test("beta org not on allowlist is inactive", () => {
    expect(
      isActive(entitled, "credit", {
        organizationId: "org-other",
        rollouts,
      })
    ).toBe(false)
  })

  test("on + not entitled plan is inactive", () => {
    expect(
      isActive(enterpriseOnly, "credit", {
        organizationId: orgA,
        rollouts,
      })
    ).toBe(false)
  })

  test("on + entitled plan is active", () => {
    expect(
      isActive(enterpriseOnly, "enterprise", {
        organizationId: orgA,
        rollouts,
      })
    ).toBe(true)
  })

  test("listActiveExtensions and contributions respect rollout", () => {
    const active = listActiveExtensions("credit", [entitled, enterpriseOnly], {
      organizationId: "org-other",
      rollouts,
    })
    expect(active).toHaveLength(0)

    const contributions = getActiveContributions("credit", [entitled], {
      organizationId: orgA,
      rollouts,
    })
    expect(contributions.uiSlots).toEqual(["quote.rateSources"])
  })
})
