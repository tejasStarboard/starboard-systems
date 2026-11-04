import type { Locator, Page } from "@playwright/test"

/** Primary sidebar is a complementary landmark, not navigation. */
export function primarySidebar(page: Page): Locator {
  return page.getByRole("complementary", { name: "Primary sidebar" })
}

export function activityBar(page: Page): Locator {
  return page.getByRole("navigation", { name: "Activity bar" })
}

export function editorGroup(page: Page): Locator {
  return page.getByRole("region", { name: "Editor group" })
}

/** Editor chrome heading (avoids sidebar h2 duplicates like "Quotes"). */
export function editorHeading(page: Page, name: string | RegExp): Locator {
  return editorGroup(page).getByRole("heading", { name })
}
