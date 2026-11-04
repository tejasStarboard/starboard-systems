import { expect, test } from "@playwright/test"

test.describe("forgot password", () => {
  test("renders reset request form", async ({ page }) => {
    await page.goto("/forgot-password")

    await expect(
      page.getByRole("heading", { name: "Forgot password" })
    ).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Send reset link" })
    ).toBeVisible()
  })

  test("validates email before submit", async ({ page }) => {
    await page.goto("/forgot-password")
    await page.locator("form").evaluate((form: HTMLFormElement) => {
      form.noValidate = true
    })
    await page.getByLabel("Email").fill("bad")
    await page.getByRole("button", { name: "Send reset link" }).click()

    await expect(
      page.getByRole("alert").filter({ hasText: "Enter a valid email" })
    ).toBeVisible()
  })

  test("links back to sign in", async ({ page }) => {
    await page.goto("/forgot-password")
    await page.getByRole("link", { name: "Back to sign in" }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
