import { expect, test } from "@playwright/test"

/**
 * Unauthenticated users must not land in the workbench.
 * requireOrganizationContext → redirect("/login").
 */
const protectedPaths = [
  "/",
  "/quotes",
  "/customers",
  "/settings",
  "/rates",
  "/rates/search",
  "/messaging/inbox",
  "/admin",
]

test.describe("protected routes (unauthenticated)", () => {
  for (const path of protectedPaths) {
    test(`redirects ${path} to login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()
    })
  }
})
