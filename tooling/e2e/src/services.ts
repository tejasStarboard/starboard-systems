import { spawn, type ChildProcess } from "node:child_process"

import { repoRoot } from "./paths"

const DOMAIN_SERVICES = [
  {
    filter: "@starboard/svc-geography",
    url: () => process.env.GEOGRAPHY_SERVICE_URL ?? "http://127.0.0.1:3101",
  },
  {
    filter: "@starboard/svc-quotes",
    url: () => process.env.QUOTES_SERVICE_URL ?? "http://127.0.0.1:3102",
  },
  {
    filter: "@starboard/svc-crm",
    url: () => process.env.CRM_SERVICE_URL ?? "http://127.0.0.1:3103",
  },
  {
    filter: "@starboard/svc-rates",
    url: () => process.env.RATES_SERVICE_URL ?? "http://127.0.0.1:3104",
  },
] as const

export async function isUp(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1500),
    })
    return response.status > 0
  } catch {
    return false
  }
}

async function waitForUrl(url: string, label: string, ms = 45_000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (await isUp(url)) {
      console.log(`  ✓ ${label} (${url})`)
      return true
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  console.warn(`  ⚠ ${label} not ready at ${url}`)
  return false
}

/** Start domain HTTP services if missing. Returns child processes to kill later. */
export async function ensureDomainServices(): Promise<ChildProcess[]> {
  const children: ChildProcess[] = []
  const root = repoRoot()
  console.log("→ ensuring domain services")
  for (const service of DOMAIN_SERVICES) {
    const url = service.url()
    if (await isUp(url)) {
      console.log(`  ✓ already up ${service.filter} (${url})`)
      continue
    }
    console.log(`  → starting ${service.filter}`)
    const child = spawn("pnpm", ["--filter", service.filter, "dev"], {
      cwd: root,
      stdio: "ignore",
      env: process.env,
    })
    children.push(child)
    await waitForUrl(url, service.filter)
  }
  return children
}

export function stopChildren(children: ChildProcess[]) {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM")
  }
}
