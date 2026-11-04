import { expect, test } from "@playwright/test"
import { editorHeading } from "@starboard/tool-e2e"

test.describe("geo.gazetteer", () => {
  test("port combobox is available on spot search", async ({ page }) => {
    await page.goto("/rates/spot")
    await expect(editorHeading(page, "Spot search")).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByLabel("Origin port")).toBeVisible()
    await expect(page.getByLabel("Destination port")).toBeVisible()
  })
})
