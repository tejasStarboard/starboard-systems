import { expect, test } from "@playwright/test"
import {
  activityBar,
  editorHeading,
  primarySidebar,
} from "@starboard/tool-e2e"

const settingsPages: { path: string; heading: string }[] = [
  { path: "/settings", heading: "Settings" },
  { path: "/settings/company", heading: "Company" },
  { path: "/settings/team", heading: "Team" },
  { path: "/settings/integrations", heading: "Integrations" },
  { path: "/settings/billing", heading: "Billing" },
  { path: "/settings/quote-rules", heading: "Quote rules" },
  { path: "/settings/profile", heading: "Profile" },
  { path: "/settings/preferences", heading: "Preferences" },
]

test.describe("org.settings", () => {
  for (const { path, heading } of settingsPages) {
    test(`renders ${path}`, async ({ page }) => {
      await page.goto(path)
      // Prefer the editor heading; avoid matching Next's empty route announcer alert.
      await expect(editorHeading(page, heading)).toBeVisible({
        timeout: 30_000,
      })
    })
  }

  test("company form loads org name", async ({ page }) => {
    await page.goto("/settings/company")
    await expect(editorHeading(page, "Company")).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByLabel(/^name$/i)).not.toHaveValue("")
  })

  test("activity bar opens settings", async ({ page }) => {
    await page.goto("/")
    await activityBar(page).getByRole("button", { name: "Settings" }).click()
    await expect(primarySidebar(page)).toBeVisible()
  })
})
