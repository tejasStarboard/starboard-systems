import { expect, test } from "@playwright/test"

test.describe("login", () => {
  test("renders sign-in form and brand", async ({ page }) => {
    await page.goto("/login")

    await expect(page.getByRole("link", { name: "Starboard" })).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Sign in" })
    ).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Create one" })
    ).toBeVisible()
  })

  test("shows validation errors for empty submit", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page.getByRole("alert").first()).toBeVisible()
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  })

  test("shows validation error for invalid email", async ({ page }) => {
    await page.goto("/login")
    // Bypass native type=email so zod/RHF validation is what we assert.
    await page.locator("form").evaluate((form: HTMLFormElement) => {
      form.noValidate = true
    })
    await page.getByLabel("Email").fill("not-an-email")
    await page.getByLabel("Password").fill("secret")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(
      page.getByRole("alert").filter({ hasText: "Enter a valid email" })
    ).toBeVisible()
  })

  test("links to forgot-password and register", async ({ page }) => {
    await page.goto("/login")

    await page.getByRole("link", { name: "Forgot password?" }).click()
    await expect(page).toHaveURL(/\/forgot-password/)
    await expect(
      page.getByRole("heading", { name: "Forgot password" })
    ).toBeVisible()

    await page.goto("/login")
    await page.getByRole("link", { name: "Create one" }).click()
    await expect(page).toHaveURL(/\/register/)
    await expect(
      page.getByRole("heading", { name: "Create account" })
    ).toBeVisible()
  })
})
