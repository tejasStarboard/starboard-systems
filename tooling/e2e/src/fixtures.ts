import { existsSync, readFileSync } from "node:fs"

import type { E2eFixtures } from "./credentials"
import { authPaths } from "./paths"

export function readE2eFixtures(): E2eFixtures {
  const { fixtures } = authPaths()
  if (!existsSync(fixtures)) {
    throw new Error(
      `Missing ${fixtures}. Run pnpm test:e2e (orchestrator seeds + auth setup).`
    )
  }
  return JSON.parse(readFileSync(fixtures, "utf8")) as E2eFixtures
}
