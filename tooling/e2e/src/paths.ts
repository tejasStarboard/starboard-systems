import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/** Monorepo root (directory with pnpm-workspace.yaml). */
export function repoRoot(from = process.cwd()): string {
  let dir = resolve(from)
  for (;;) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir
    const parent = dirname(dir)
    if (parent === dir) {
      // Fallback: tooling/e2e → repo root
      return resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
    }
    dir = parent
  }
}

export function webAppRoot(root = repoRoot()): string {
  return resolve(root, "apps/web")
}

/** Shared auth artifacts live under the shell app so every package reuses one login. */
export function authPaths(root = repoRoot()) {
  const authDir = resolve(webAppRoot(root), "e2e/.auth")
  return {
    authDir,
    storageState: resolve(authDir, "user.json"),
    fixtures: resolve(authDir, "fixtures.json"),
  }
}

export function defaultBaseURL(): string {
  return process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
}
