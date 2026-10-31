import { describe, expect, test } from "bun:test"

import {
  buildExtensionSettingValues,
  fieldsFromStaffSettings,
  type SettingFormField,
} from "./extension-settings-form"

const fields: SettingFormField[] = [
  {
    key: "live_strategy",
    label: "Live strategy",
    type: "boolean",
    required: false,
    booleanValue: false,
    textValue: "",
    configured: false,
    secretDirty: false,
  },
  {
    key: "sync_interval_minutes",
    label: "Sync interval",
    type: "number",
    required: false,
    booleanValue: false,
    textValue: "15",
    configured: false,
    secretDirty: false,
  },
  {
    key: "api_token",
    label: "API token",
    type: "secret",
    required: false,
    booleanValue: false,
    textValue: "",
    configured: true,
    secretDirty: false,
  },
]

describe("buildExtensionSettingValues", () => {
  test("coerces numbers and omits an untouched secret", () => {
    expect(buildExtensionSettingValues(fields)).toEqual({
      ok: true,
      values: {
        live_strategy: false,
        sync_interval_minutes: 15,
      },
    })
  })

  test("includes a secret only after it is edited", () => {
    const result = buildExtensionSettingValues([
      ...fields.slice(0, 2),
      { ...fields[2]!, secretDirty: true, textValue: "new-token" },
    ])
    expect(result).toEqual({
      ok: true,
      values: {
        live_strategy: false,
        sync_interval_minutes: 15,
        api_token: "new-token",
      },
    })
  })

  test("rejects a blank number", () => {
    expect(
      buildExtensionSettingValues([{ ...fields[1]!, textValue: "" }])
    ).toEqual({
      ok: false,
      message: 'Expected a number for "sync_interval_minutes"',
    })
  })
})

describe("fieldsFromStaffSettings", () => {
  test("keeps a configured secret empty until the user types", () => {
    expect(
      fieldsFromStaffSettings([
        {
          key: "api_token",
          label: "API token",
          type: "secret",
          scope: "platform",
          required: true,
          configured: true,
        },
      ])
    ).toEqual([
      {
        key: "api_token",
        label: "API token",
        description: undefined,
        type: "secret",
        required: true,
        options: undefined,
        booleanValue: false,
        textValue: "",
        configured: true,
        secretDirty: false,
      },
    ])
  })
})
