import { expect, test } from "@playwright/test"
import {
  activityBar,
  editorHeading,
  primarySidebar,
  readE2eFixtures,
} from "@starboard/tool-e2e"

test.describe("crm.parties", () => {
  test("customers list renders", async ({ page }) => {
    await page.goto("/customers")
    await expect(editorHeading(page, "Customers")).toBeVisible({
      timeout: 30_000,
    })
  })

  test("activity bar opens customers", async ({ page }) => {
    await page.goto("/")
    await activityBar(page).getByRole("button", { name: "Customers" }).click()
    await expect(primarySidebar(page)).toBeVisible()
  })

  test("seeded customer detail when CRM seeded", async ({ page }) => {
    const fixtures = readE2eFixtures()
    test.skip(
      !fixtures.customerId,
      "CRM service did not seed a customer — start services/crm"
    )

    await page.goto(`/customers/${fixtures.customerId}`)
    await expect(page.getByTestId("customer-editor-loading")).toHaveCount(0, {
      timeout: 20_000,
    })
    await expect(page.getByText(/E2E Customer/i).first()).toBeVisible()
  })
})
