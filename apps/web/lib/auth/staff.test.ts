import { describe, expect, test } from "bun:test"

import { isStaffUserIdInAllowlist } from "./staff-allowlist"

describe("staff allowlist", () => {
  test("listed user is staff", () => {
    expect(isStaffUserIdInAllowlist("user-1", ["user-1", "user-2"])).toBe(true)
  })

  test("unlisted user is not staff", () => {
    expect(isStaffUserIdInAllowlist("user-9", ["user-1"])).toBe(false)
  })

  test("empty allowlist admits nobody", () => {
    expect(isStaffUserIdInAllowlist("user-1", [])).toBe(false)
  })
})
