import { expect, test } from "@playwright/test"
import { activityBar, editorGroup, editorHeading } from "@starboard/tool-e2e"

test.describe("workbench shell", () => {
  test("shows activity bar with built-in activities", async ({ page }) => {
    await page.goto("/")

    const bar = activityBar(page)
    await expect(bar).toBeVisible()
    await expect(bar.getByRole("button", { name: "Quotes" })).toBeVisible()
    await expect(bar.getByRole("button", { name: "Customers" })).toBeVisible()
    await expect(bar.getByRole("button", { name: "Settings" })).toBeVisible()
    await expect(bar.getByRole("button", { name: "Rates" })).toBeVisible()
  })

  test("home shows New Tab welcome", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("new-tab-welcome")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "New Quote" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Search Quotes" })
    ).toBeVisible()
  })

  test("quotes list renders at /quotes", async ({ page }) => {
    await page.goto("/quotes")
    await expect(editorHeading(page, "Quotes")).toBeVisible()
    await expect(
      editorGroup(page).getByRole("button", { name: "New quote" })
    ).toBeVisible()
  })

  test("account menu exposes signed-in user", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Account menu" }).click()
    await expect(page.getByText(/e2e@starboard\.test/i)).toBeVisible()
  })
})
