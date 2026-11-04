import { expect, test } from "@playwright/test"

test.describe("admin gate (non-staff)", () => {
  test("regular e2e user cannot open admin", async ({ page }) => {
    const response = await page.goto("/admin")
    // Staff layout calls notFound() for non-staff → Next 404 page.
    expect(response?.status()).toBe(404)
  })
})
