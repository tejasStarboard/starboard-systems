import { expect, test } from "@playwright/test"
import {
  editorGroup,
  editorHeading,
  readE2eFixtures,
} from "@starboard/tool-e2e"

test.describe("quoting.document", () => {
  test("quotes list shows new-quote action", async ({ page }) => {
    await page.goto("/")
    await expect(editorHeading(page, "Quotes")).toBeVisible()
    await expect(
      editorGroup(page).getByRole("button", { name: "New quote" })
    ).toBeVisible()
  })

  test("opens seeded quote editor when quotes service seeded", async ({
    page,
  }) => {
    const fixtures = readE2eFixtures()
    test.skip(
      !fixtures.quoteId,
      "Quotes service did not seed a quote — start services/quotes"
    )

    await page.goto(`/quote/${fixtures.quoteId}`)
    await expect(page.getByTestId("quote-editor-loading")).toHaveCount(0, {
      timeout: 20_000,
    })
    await expect(page.getByTestId("quote-lifecycle-chrome")).toBeVisible()
  })

  test("new quote creates and opens editor when service up", async ({
    page,
  }) => {
    const fixtures = readE2eFixtures()
    test.skip(
      !fixtures.quoteId,
      "Quotes service unavailable — skip create flow"
    )

    await page.goto("/")
    await editorGroup(page).getByRole("button", { name: "New quote" }).click()
    await expect(page).toHaveURL(/\/quote\/[^/]+/, { timeout: 20_000 })
    await expect(page.getByTestId("quote-lifecycle-chrome")).toBeVisible({
      timeout: 20_000,
    })
  })
})
