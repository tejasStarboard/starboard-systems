import { afterEach, describe, expect, mock, test } from "bun:test"

import {
  requestExitImpersonation,
  requestStartImpersonation,
} from "./use-impersonation"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("requestStartImpersonation", () => {
  test("returns ok on success", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 204 }))
    ) as unknown as typeof fetch

    await expect(requestStartImpersonation("org-1")).resolves.toEqual({
      ok: true,
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/impersonation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ organizationId: "org-1" }),
      })
    )
  })

  test("returns API error message on failure", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Not staff" }), { status: 403 })
      )
    ) as unknown as typeof fetch

    await expect(requestStartImpersonation("org-1")).resolves.toEqual({
      ok: false,
      message: "Not staff",
    })
  })
})

describe("requestExitImpersonation", () => {
  test("DELETE /api/admin/impersonation", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 204 }))
    ) as unknown as typeof fetch

    await requestExitImpersonation()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/impersonation",
      expect.objectContaining({ method: "DELETE" })
    )
  })
})
