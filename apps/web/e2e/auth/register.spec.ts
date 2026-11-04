import { expect, test } from "@playwright/test"

test.describe("register", () => {
  test("renders create-account form", async ({ page }) => {
    await page.goto("/register")

    await expect(
      page.getByRole("heading", { name: "Create account" })
    ).toBeVisible()
    await expect(page.getByLabel("Name")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create account" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible()
  })

  test("rejects short passwords client-side", async ({ page }) => {
    await page.goto("/register")
    await page.getByLabel("Name").fill("Test User")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("short")
    await page.getByRole("button", { name: "Create account" }).click()

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Password must be at least 8 characters" })
    ).toBeVisible()
  })

  test("navigates back to login", async ({ page }) => {
    await page.goto("/register")
    await page.getByRole("link", { name: "Sign in" }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
