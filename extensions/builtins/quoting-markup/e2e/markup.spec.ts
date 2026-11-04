import { expect, test } from "@playwright/test"
import { readE2eFixtures } from "@starboard/tool-e2e"

async function pickPort(page: import("@playwright/test").Page, nth: number) {
  const input = page.getByPlaceholder("UNLOCODE").nth(nth)
  await input.click()
  await input.fill(nth === 0 ? "CNSHA" : "USLAX")
  const option = page.getByRole("option").first()
  await expect(option).toBeVisible({ timeout: 15_000 })
  await option.click()
}

test.describe("quoting.markup", () => {
  test("markup footer appears after adding a manual rate", async ({ page }) => {
    const fixtures = readE2eFixtures()
    test.skip(!fixtures.quoteId, "Needs seeded quote (quotes service)")

    await page.goto(`/quote/${fixtures.quoteId}`)
    await expect(page.getByTestId("quote-editor-loading")).toHaveCount(0, {
      timeout: 30_000,
    })

    await pickPort(page, 0)
    await pickPort(page, 1)

    const addRate = page.getByRole("button", { name: "Add manual rate" })
    await expect(addRate).toBeEnabled({ timeout: 30_000 })
    await addRate.click()
    await expect(page.getByText(/Markup/i).first()).toBeVisible({
      timeout: 30_000,
    })
  })
})
