import { describe, expect, test } from "bun:test"

import {
  decryptSecret,
  encryptSecret,
  isSecretEnvelope,
} from "./extension-secret"

const secret = "ci-extension-settings-secret-32!!"

describe("extension setting encryption", () => {
  test("round-trips plaintext and stores only ciphertext", () => {
    const plaintext = "maersk-password-do-not-store"
    const envelope = encryptSecret(plaintext, secret)
    expect(isSecretEnvelope(envelope)).toBe(true)
    expect(JSON.stringify(envelope)).not.toContain(plaintext)
    expect(decryptSecret(envelope, secret)).toBe(plaintext)
  })

  test("rejects a tampered tag", () => {
    const envelope = encryptSecret("token", secret)
    const tampered = {
      ...envelope,
      tag: Buffer.from("0123456789abcdef").toString("base64"),
    }
    expect(() => decryptSecret(tampered, secret)).toThrow()
  })
})
