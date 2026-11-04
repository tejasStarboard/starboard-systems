import { expect, test } from "@playwright/test"
import { readE2eFixtures } from "@starboard/tool-e2e"

test.describe("quoting.charges", () => {
  test("charge table contribution mounts on quote editor", async ({ page }) => {
    const fixtures = readE2eFixtures()
    test.skip(!fixtures.quoteId, "Needs seeded quote (quotes service)")

    await page.goto(`/quote/${fixtures.quoteId}`)
    await expect(page.getByTestId("quote-editor-loading")).toHaveCount(0, {
      timeout: 30_000,
    })
    // Charges slot unlocks "Add manual rate" (grid itself needs a rate row).
    await expect(
      page.getByRole("button", { name: "Add manual rate" })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId("charges-unavailable")).toHaveCount(0)
  })
})
