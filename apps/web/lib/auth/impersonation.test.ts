import { describe, expect, test } from "bun:test"

import {
  decodeImpersonationToken,
  encodeImpersonationToken,
} from "./impersonation-token"

const SECRET = "test-secret-at-least-32-characters!!"

describe("impersonation token", () => {
  test("round-trips payload for matching actor", () => {
    const token = encodeImpersonationToken(
      { organizationId: "org-1", actorUserId: "staff-1" },
      SECRET
    )
    const parsed = decodeImpersonationToken(token, "staff-1", SECRET)
    expect(parsed?.organizationId).toBe("org-1")
    expect(parsed?.actorUserId).toBe("staff-1")
  })

  test("rejects mismatched actor", () => {
    const token = encodeImpersonationToken(
      { organizationId: "org-1", actorUserId: "staff-1" },
      SECRET
    )
    expect(decodeImpersonationToken(token, "other", SECRET)).toBeNull()
  })

  test("rejects tampered token", () => {
    const token = encodeImpersonationToken(
      { organizationId: "org-1", actorUserId: "staff-1" },
      SECRET
    )
    expect(decodeImpersonationToken(`${token}x`, "staff-1", SECRET)).toBeNull()
  })

  test("rejects expired token", () => {
    const now = Date.now()
    const token = encodeImpersonationToken(
      { organizationId: "org-1", actorUserId: "staff-1" },
      SECRET,
      now
    )
    expect(
      decodeImpersonationToken(
        token,
        "staff-1",
        SECRET,
        now + 9 * 60 * 60 * 1000
      )
    ).toBeNull()
  })
})
