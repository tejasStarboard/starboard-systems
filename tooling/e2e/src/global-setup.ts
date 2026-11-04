import type { FullConfig } from "@playwright/test"

import { prepareAuthenticatedSession } from "./auth-setup"
import { loadWebEnv } from "./load-env"
import { defaultBaseURL } from "./paths"

/** Playwright globalSetup for the shell — seeds + writes shared storageState. */
async function globalSetup(config: FullConfig) {
  loadWebEnv()
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    defaultBaseURL()
  await prepareAuthenticatedSession(baseURL)
}

export default globalSetup
