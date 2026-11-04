#!/usr/bin/env bun
/**
 * Starboard e2e orchestrator:
 *   seed → domain services → Chromium → shell Playwright → builtin extension Playwright
 *
 *   pnpm exec starboard-e2e
 *   pnpm --filter @starboard/tool-e2e starboard-e2e -- --ui
 *   pnpm --filter @starboard/app-web test:e2e
 */
import { spawnSync, type ChildProcess } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { prepareAuthenticatedSession } from "./auth-setup"
import { loadWebEnv } from "./load-env"
import { defaultBaseURL, repoRoot, webAppRoot } from "./paths"
import { ensureDomainServices, isUp, stopChildren } from "./services"
import { seedE2e } from "./seed"

const extraArgs = process.argv.slice(2)
const children: ChildProcess[] = []

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

async function ensureWeb() {
  const url = defaultBaseURL()
  if (await isUp(url)) {
    console.log(`→ web already up (${url})`)
    return
  }
  console.log(`→ starting @starboard/app-web`)
  const { spawn } = await import("node:child_process")
  const child = spawn(
    "pnpm",
    ["--filter", "@starboard/app-web", process.env.CI ? "start" : "dev"],
    {
      cwd: repoRoot(),
      stdio: "ignore",
      env: process.env,
    }
  )
  children.push(child)
  const start = Date.now()
  while (Date.now() - start < 120_000) {
    if (await isUp(url)) {
      console.log(`  ✓ web (${url})`)
      return
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for web at ${url}`)
}

function discoverBuiltinE2ePackages(): string[] {
  const builtins = resolve(repoRoot(), "extensions/builtins")
  if (!existsSync(builtins)) return []
  const out: string[] = []
  for (const name of readdirSync(builtins)) {
    const dir = resolve(builtins, name)
    const pkgPath = resolve(dir, "package.json")
    const e2eDir = resolve(dir, "e2e")
    if (!existsSync(pkgPath) || !existsSync(e2eDir)) continue
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
        scripts?: { "test:e2e"?: string }
      }
      if (pkg.scripts?.["test:e2e"]) out.push(dir)
    } catch {
      /* skip */
    }
  }
  return out.sort()
}

function cleanup() {
  stopChildren(children)
}

async function main() {
  loadWebEnv()
  process.on("exit", cleanup)
  process.on("SIGINT", () => {
    cleanup()
    process.exit(130)
  })
  process.on("SIGTERM", () => {
    cleanup()
    process.exit(143)
  })

  console.log("→ seeding e2e fixtures")
  await seedE2e()

  if (process.env.E2E_SKIP_SERVICES !== "1") {
    children.push(...(await ensureDomainServices()))
  } else {
    console.log("→ skipping domain services (E2E_SKIP_SERVICES=1)")
  }

  await ensureWeb()

  console.log("→ ensuring Chromium")
  run("pnpm", ["exec", "playwright", "install", "chromium"], webAppRoot())

  console.log("→ preparing authenticated session")
  await prepareAuthenticatedSession(defaultBaseURL())

  const ui = extraArgs.includes("--ui")
  const playwrightArgs = extraArgs.filter((a) => a !== "--ui")

  console.log("→ shell e2e (@starboard/app-web)")
  run(
    "pnpm",
    ui
      ? ["exec", "playwright", "test", "--ui", ...playwrightArgs]
      : ["exec", "playwright", "test", ...playwrightArgs],
    webAppRoot()
  )

  const extensionPackages = discoverBuiltinE2ePackages()
  let extensionFailures = 0
  for (const dir of extensionPackages) {
    console.log(`→ extension e2e (${dir})`)
    const result = spawnSync(
      "pnpm",
      ui
        ? ["exec", "playwright", "test", "--ui", ...playwrightArgs]
        : ["exec", "playwright", "test", ...playwrightArgs],
      {
        cwd: dir,
        stdio: "inherit",
        env: process.env,
        shell: process.platform === "win32",
      }
    )
    if (result.status !== 0) extensionFailures += 1
  }

  cleanup()
  if (extensionFailures > 0) {
    console.error(`e2e: ${extensionFailures} extension package(s) failed`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  cleanup()
  process.exit(1)
})
