import { describe, expect, test } from "bun:test"

import { decodeMessagingOAuthState } from "./messaging-oauth-state"

describe("decodeMessagingOAuthState", () => {
  test("decodes organization id from base64url state", () => {
    const state = Buffer.from("org_abc:nonce123", "utf8").toString("base64url")
    expect(decodeMessagingOAuthState(state)).toBe("org_abc")
  })

  test("returns null for empty organization", () => {
    const state = Buffer.from(":nonce", "utf8").toString("base64url")
    expect(decodeMessagingOAuthState(state)).toBeNull()
  })
})
