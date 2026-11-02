import { describe, expect, test } from "bun:test"

import { resolveStaffSettings } from "@starboard/ext-host"
import type { ExtensionSettingContribution } from "@starboard/ext-host"

import {
  missingRequiredSecrets,
  openSecretValues,
  sealSettingEntries,
} from "./carrier-credentials"

const secret = "ci-extension-settings-secret-32!!"

const declarations: ExtensionSettingContribution[] = [
  {
    key: "username",
    label: "Username",
    type: "secret",
    scope: "organization",
    required: true,
  },
  {
    key: "password",
    label: "Password",
    type: "secret",
    scope: "organization",
    required: true,
  },
  {
    key: "live_strategy",
    label: "Live strategy",
    type: "boolean",
    scope: "platform",
    default: false,
  },
]

describe("carrier credential storage", () => {
  test("seals secrets and the public view never includes plaintext", () => {
    const plaintext = "super-secret-password"
    const sealed = sealSettingEntries(
      declarations,
      [
        { key: "username", value: "demo-user" },
        { key: "password", value: plaintext },
      ],
      secret
    )
    expect(JSON.stringify(sealed)).not.toContain(plaintext)
    expect(openSecretValues(declarations, sealed, secret)).toEqual({
      username: "demo-user",
      password: plaintext,
    })

    const staff = resolveStaffSettings(declarations, sealed)
    const password = staff.find((setting) => setting.key === "password")
    expect(password).toMatchObject({ configured: true, type: "secret" })
    expect(password).not.toHaveProperty("value")
    expect(JSON.stringify(staff)).not.toContain(plaintext)
  })

  test("requires a first-time secret and ignores platform settings", () => {
    expect(
      missingRequiredSecrets(declarations, new Set(), { username: "demo" })
    ).toBe('"password" is required')
    expect(
      missingRequiredSecrets(declarations, new Set(["password"]), {
        username: "demo",
      })
    ).toBeNull()
  })

  test("org rows do not open another org's ciphertext by mixing keys", () => {
    const orgA = sealSettingEntries(
      declarations,
      [{ key: "password", value: "org-a-password" }],
      secret
    )
    const orgB = sealSettingEntries(
      declarations,
      [{ key: "password", value: "org-b-password" }],
      secret
    )
    expect(openSecretValues(declarations, orgA, secret).password).toBe(
      "org-a-password"
    )
    expect(openSecretValues(declarations, orgB, secret).password).not.toBe(
      "org-a-password"
    )
  })
})
