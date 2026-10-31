import { describe, expect, test } from "bun:test"
import {
  getActiveContributions,
  listActiveExtensions,
  listManifests,
} from "@starboard/ext-host"

describe("all-off extension smoke", () => {
  test("enabled false yields empty nav, slots, and active set", () => {
    const allOff = listManifests().map((manifest) => ({
      ...manifest,
      enabled: false,
    }))
    const contributions = getActiveContributions("enterprise", allOff)
    expect(contributions.nav).toEqual([])
    expect(contributions.uiSlots).toEqual([])
    expect(listActiveExtensions("enterprise", allOff)).toEqual([])
    expect(
      contributions.nav.some((item) => item.href === "/rates/upload")
    ).toBe(false)
    expect(
      contributions.nav.some((item) => item.href === "/messaging/inbox")
    ).toBe(false)
  })

  test("rollout off for every registered id yields empty contributions", () => {
    const manifests = listManifests()
    const rollouts = new Map(
      manifests.map((manifest) => [
        manifest.id,
        { mode: "off" as const, organizationIds: [] as string[] },
      ])
    )
    const contributions = getActiveContributions("enterprise", manifests, {
      organizationId: "org-1",
      rollouts,
    })
    expect(contributions.nav).toEqual([])
    expect(contributions.uiSlots).toEqual([])
  })
})
