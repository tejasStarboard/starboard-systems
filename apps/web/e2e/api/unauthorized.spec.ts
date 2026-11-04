import { expect, test } from "@playwright/test"

/**
 * BFF API routes gate on requireApiSession — no cookie → 401.
 * Covers the shell surface without needing domain services up.
 */
const protectedApis = [
  "/api/quotes",
  "/api/customers",
  "/api/rates",
  "/api/geography/ports",
  "/api/settings/context",
]

test.describe("API unauthorized", () => {
  for (const path of protectedApis) {
    test(`GET ${path} returns 401`, async ({ request }) => {
      const response = await request.get(path)
      expect(response.status()).toBe(401)
      await expect(response.json()).resolves.toMatchObject({
        error: "Unauthorized",
      })
    })
  }
})
