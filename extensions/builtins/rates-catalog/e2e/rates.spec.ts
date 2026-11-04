import { expect, test } from "@playwright/test"
import {
  activityBar,
  editorHeading,
  primarySidebar,
} from "@starboard/tool-e2e"

test.describe("rates.catalog", () => {
  test("activity bar opens rates", async ({ page }) => {
    await page.goto("/")
    await activityBar(page).getByRole("button", { name: "Rates" }).click()
    await expect(primarySidebar(page)).toBeVisible()
    await expect(primarySidebar(page).getByText("Search Rates")).toBeVisible()
    await expect(primarySidebar(page).getByText("Rate Sheets")).toBeVisible()
  })

  test("loads /rates/search", async ({ page }) => {
    await page.goto("/rates/search")
    await expect(editorHeading(page, "Search Rates")).toBeVisible({
      timeout: 30_000,
    })
  })

  test("loads /rates/sheets", async ({ page }) => {
    await page.goto("/rates/sheets")
    await expect(editorHeading(page, "Rate catalog")).toBeVisible({
      timeout: 30_000,
    })
  })

  test("loads /rates/sell placeholder", async ({ page }) => {
    await page.goto("/rates/sell")
    await expect(page.getByText("Coming soon.")).toBeVisible({
      timeout: 30_000,
    })
  })

  test("loads /rates/spot", async ({ page }) => {
    await page.goto("/rates/spot")
    await expect(editorHeading(page, "Spot search")).toBeVisible({
      timeout: 30_000,
    })
  })
})
