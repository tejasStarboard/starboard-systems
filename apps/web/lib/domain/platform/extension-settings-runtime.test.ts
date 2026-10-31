import { describe, expect, test } from "bun:test"

import {
  liveStrategyEnabled,
  messagingJobSettingsFromResolved,
  settingsForJobInput,
  spotJobSettingsFromResolved,
  syncIntervalMinutes,
} from "@/lib/domain/platform/extension-settings-runtime"

describe("extension-settings-runtime", () => {
  test("liveStrategyEnabled follows boolean setting", () => {
    expect(liveStrategyEnabled({ live_strategy: true })).toBe(true)
    expect(liveStrategyEnabled({ live_strategy: false })).toBe(false)
    expect(liveStrategyEnabled({})).toBe(false)
  })

  test("syncIntervalMinutes uses resolved value or fallback", () => {
    expect(syncIntervalMinutes({ sync_interval_minutes: 30 })).toBe(30)
    expect(syncIntervalMinutes({ sync_interval_minutes: 0 })).toBe(15)
    expect(syncIntervalMinutes({})).toBe(15)
  })

  test("settingsForJobInput omits secret keys for unknown extensions", () => {
    expect(
      settingsForJobInput("spot.maersk", {
        live_strategy: true,
      })
    ).toEqual({ live_strategy: true })

    expect(
      settingsForJobInput("missing.ext", {
        api_key: "super-secret",
        live_strategy: true,
      })
    ).toEqual({})
  })

  test("spotJobSettingsFromResolved maps live_strategy for maersk and cma", () => {
    expect(
      spotJobSettingsFromResolved("spot.maersk", { live_strategy: true })
    ).toEqual({ liveStrategy: true })
    expect(
      spotJobSettingsFromResolved("spot.maersk", { live_strategy: false })
    ).toEqual({ liveStrategy: false })
    expect(
      spotJobSettingsFromResolved("spot.cma", { live_strategy: true })
    ).toEqual({ liveStrategy: true })
    expect(
      spotJobSettingsFromResolved("spot.cma", { live_strategy: false })
    ).toEqual({ liveStrategy: false })
    expect(spotJobSettingsFromResolved("spot.fake", {})).toEqual({})
  })

  test("messagingJobSettingsFromResolved maps sync interval", () => {
    expect(
      messagingJobSettingsFromResolved("messaging.msgraph", {
        sync_interval_minutes: 45,
      })
    ).toEqual({ syncIntervalMinutes: 45 })
    expect(messagingJobSettingsFromResolved("messaging.msgraph", {})).toEqual({
      syncIntervalMinutes: 15,
    })
  })
})
