import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { repoRoot, webAppRoot } from "./paths"

/** Load KEY=VALUE pairs into process.env without overriding existing values. */
export function loadEnvFile(path: string) {
  if (!existsSync(path)) return
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

/** Load apps/web/.env then repo root .env. */
export function loadWebEnv(cwd = process.cwd()) {
  const root = repoRoot(cwd)
  loadEnvFile(resolve(webAppRoot(root), ".env"))
  loadEnvFile(resolve(root, ".env"))
  loadEnvFile(resolve(cwd, ".env"))
}
