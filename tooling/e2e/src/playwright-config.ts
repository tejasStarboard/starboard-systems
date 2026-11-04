import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test"

import { authPaths, defaultBaseURL, webAppRoot } from "./paths"

const shared = {
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: (process.env.CI ? [["github"], ["list"]] : "list") as
    | "list"
    | [["github"], ["list"]],
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: defaultBaseURL(),
    trace: "on-first-retry" as const,
    screenshot: "only-on-failure" as const,
    video: "retain-on-failure" as const,
  },
}

/**
 * Shell BFF config (`apps/web`): auth + kernel projects; owns webServer + globalSetup.
 */
export function defineShellE2eConfig(
  overrides: PlaywrightTestConfig = {}
): PlaywrightTestConfig {
  const { storageState } = authPaths()
  return defineConfig({
    ...shared,
    testDir: "./e2e",
    globalSetup: "@starboard/tool-e2e/global-setup",
    projects: [
      {
        name: "auth",
        testMatch: ["auth/**/*.spec.ts", "api/**/*.spec.ts", "app/**/*.spec.ts"],
        use: { ...devices["Desktop Chrome"] },
      },
      {
        name: "authenticated",
        testMatch: ["authenticated/**/*.spec.ts"],
        use: {
          ...devices["Desktop Chrome"],
          storageState,
        },
      },
    ],
    webServer: {
      command: process.env.CI ? "pnpm start" : "pnpm dev",
      cwd: webAppRoot(),
      url: defaultBaseURL(),
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    ...overrides,
  })
}

/**
 * Extension package config: authenticated only, reuses shell storageState.
 * Does not start webServer — run via `starboard-e2e` orchestrator (or with web already up).
 */
export function defineExtensionE2eConfig(
  overrides: PlaywrightTestConfig = {}
): PlaywrightTestConfig {
  const { storageState } = authPaths()
  return defineConfig({
    ...shared,
    testDir: "./e2e",
    // Auth is prepared by the orchestrator / shell globalSetup.
    globalSetup: undefined,
    use: {
      ...shared.use,
      ...devices["Desktop Chrome"],
      storageState,
    },
    ...overrides,
  })
}
