import { describe, expect, test } from "bun:test"

import { extensionManifestSchema } from "./manifest.js"
import { listManifests } from "./registry.js"
import {
  getDeclaredSettings,
  resolveExtensionSettingValues,
  resolveStaffSettings,
  validateSettingValues,
} from "./settings.js"

const baseManifest = {
  id: "spot.example",
  version: "0.0.0",
  displayName: "Example",
  requiredPlan: ["credit" as const],
  contributes: {
    settings: [
      {
        key: "live_strategy",
        label: "Live strategy",
        type: "boolean" as const,
        default: false,
        scope: "platform" as const,
      },
      {
        key: "sync_interval_minutes",
        label: "Sync interval",
        type: "number" as const,
        default: 15,
        scope: "platform" as const,
      },
      {
        key: "region",
        label: "Region",
        type: "select" as const,
        default: "eu",
        options: [
          { value: "eu", label: "EU" },
          { value: "us", label: "US" },
        ],
        scope: "platform" as const,
      },
      {
        key: "api_token",
        label: "API token",
        type: "secret" as const,
        scope: "platform" as const,
        required: true,
      },
    ],
  },
}

describe("extension settings schema", () => {
  test("accepts contributes.settings", () => {
    const parsed = extensionManifestSchema.parse(baseManifest)
    expect(getDeclaredSettings(parsed)).toHaveLength(4)
  })

  test("rejects organization scope and select settings without options", () => {
    expect(
      extensionManifestSchema.safeParse({
        ...baseManifest,
        contributes: {
          settings: [
            {
              key: "mode",
              label: "Mode",
              type: "boolean",
              scope: "organization",
            },
          ],
        },
      }).success
    ).toBe(false)

    expect(
      extensionManifestSchema.safeParse({
        ...baseManifest,
        contributes: {
          settings: [
            {
              key: "region",
              label: "Region",
              type: "select",
              scope: "platform",
            },
          ],
        },
      }).success
    ).toBe(false)
  })
})

describe("validateSettingValues", () => {
  const declarations = getDeclaredSettings(
    extensionManifestSchema.parse(baseManifest)
  )

  test("rejects unknown keys and invalid types", () => {
    expect(validateSettingValues(declarations, { missing: true })).toEqual({
      ok: false,
      message: 'Unknown setting "missing"',
    })
    expect(
      validateSettingValues(declarations, { sync_interval_minutes: "15" })
    ).toEqual({
      ok: false,
      message: 'Expected a number for "sync_interval_minutes"',
    })
    expect(validateSettingValues(declarations, { region: "apac" })).toEqual({
      ok: false,
      message: 'Value is not one of the select options for "region"',
    })
  })

  test("accepts values that match the declaration", () => {
    const result = validateSettingValues(declarations, {
      live_strategy: true,
      api_token: "secret-value",
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.entries).toEqual([
        { key: "live_strategy", value: true },
        { key: "api_token", value: "secret-value" },
      ])
    }
  })
})

describe("resolve settings", () => {
  const declarations = getDeclaredSettings(
    extensionManifestSchema.parse(baseManifest)
  )

  test("uses the manifest default when no row is stored", () => {
    expect(resolveExtensionSettingValues(declarations, [])).toEqual({
      live_strategy: false,
      sync_interval_minutes: 15,
      region: "eu",
      api_token: null,
    })

    const staff = resolveStaffSettings(declarations, [])
    expect(
      staff.find((setting) => setting.key === "live_strategy")?.value
    ).toBe(false)
    expect(staff.find((setting) => setting.key === "region")?.options).toEqual([
      { value: "eu", label: "EU" },
      { value: "us", label: "US" },
    ])
    expect(staff.find((setting) => setting.key === "api_token")).toEqual({
      key: "api_token",
      label: "API token",
      type: "secret",
      scope: "platform",
      required: true,
      configured: false,
    })
  })

  test("redacts a saved secret and keeps other stored values", () => {
    const stored = [
      { key: "live_strategy", value: true },
      { key: "api_token", value: "do-not-echo" },
    ]
    expect(resolveExtensionSettingValues(declarations, stored).api_token).toBe(
      "do-not-echo"
    )
    const secret = resolveStaffSettings(declarations, stored).find(
      (setting) => setting.key === "api_token"
    )
    expect(secret).toEqual({
      key: "api_token",
      label: "API token",
      type: "secret",
      scope: "platform",
      required: true,
      configured: true,
    })
    expect(secret).not.toHaveProperty("value")
  })
})

describe("registered extension settings", () => {
  test("maersk and msgraph each declare a setting", () => {
    const manifests = listManifests()
    const maersk = manifests.find((manifest) => manifest.id === "spot.maersk")
    const msgraph = manifests.find(
      (manifest) => manifest.id === "messaging.msgraph"
    )
    expect(getDeclaredSettings(maersk!).map((setting) => setting.key)).toEqual([
      "live_strategy",
    ])
    expect(getDeclaredSettings(msgraph!).map((setting) => setting.key)).toEqual(
      ["sync_interval_minutes"]
    )
  })
})
