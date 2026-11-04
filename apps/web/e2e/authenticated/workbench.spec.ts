import { expect, test } from "@playwright/test"
import {
  activityBar,
  editorGroup,
  editorHeading,
} from "@starboard/tool-e2e"

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

  test("quotes home renders list chrome", async ({ page }) => {
    await page.goto("/")
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
