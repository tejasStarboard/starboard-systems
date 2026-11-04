import { expect, test } from "@playwright/test"
import { readE2eFixtures } from "@starboard/tool-e2e"

test.describe("quoting.incoterm", () => {
  test("incoterm field mounts on quote editor", async ({ page }) => {
    const fixtures = readE2eFixtures()
    test.skip(!fixtures.quoteId, "Needs seeded quote (quotes service)")

    await page.goto(`/quote/${fixtures.quoteId}`)
    await expect(page.getByTestId("quote-editor-loading")).toHaveCount(0, {
      timeout: 30_000,
    })
    await expect(
      page.getByText("Incoterm", { exact: true }).first()
    ).toBeVisible({
      timeout: 30_000,
    })
  })
})
