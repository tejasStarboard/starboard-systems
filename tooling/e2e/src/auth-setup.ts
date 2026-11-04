import { mkdirSync, writeFileSync } from "node:fs"

import { e2eCredentials, type E2eFixtures } from "./credentials"
import { authPaths, defaultBaseURL } from "./paths"
import { seedE2e } from "./seed"

type CookieJar = Map<string, string>

function storeCookies(jar: CookieJar, setCookie: string | null) {
  if (!setCookie) return
  // fetch may join multiple Set-Cookie with comma; better-auth cookies are simple enough.
  for (const part of setCookie.split(/,(?=[^;]+?=)/)) {
    const [pair] = part.split(";")
    if (!pair) continue
    const eq = pair.indexOf("=")
    if (eq <= 0) continue
    const name = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    if (name) jar.set(name, value)
  }
}

function cookieHeader(jar: CookieJar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ")
}

async function postJson(
  origin: string,
  path: string,
  body: unknown,
  jar: CookieJar
): Promise<Response> {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Origin: origin,
      Referer: `${origin}/`,
      cookie: cookieHeader(jar),
    },
    body: JSON.stringify(body),
    redirect: "manual",
  })
  storeCookies(jar, response.headers.get("set-cookie"))
  return response
}

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

function toStorageState(
  jar: CookieJar,
  origin: string
): {
  cookies: Array<{
    name: string
    value: string
    domain: string
    path: string
    expires: number
    httpOnly: boolean
    secure: boolean
    sameSite: "Lax" | "None" | "Strict"
  }>
  origins: []
} {
  const host = new URL(origin).hostname
  return {
    cookies: [...jar.entries()].map(([name, value]) => ({
      name,
      value,
      domain: host,
      path: "/",
      expires: -1,
      httpOnly: true,
      secure: origin.startsWith("https"),
      sameSite: "Lax",
    })),
    origins: [],
  }
}

/**
 * Seed DB, sign in, activate org, optionally seed customer/quote, write storageState.
 * Uses native fetch (Playwright request + Bun mishandles Set-Cookie response URLs).
 */
export async function prepareAuthenticatedSession(
  baseURL = defaultBaseURL()
): Promise<E2eFixtures> {
  const fixtures = await seedE2e()
  const creds = e2eCredentials()
  const { authDir, storageState, fixtures: fixturesPath } = authPaths()
  mkdirSync(authDir, { recursive: true })

  const origin = baseURL.replace(/\/$/, "")
  const jar: CookieJar = new Map()

  const signIn = await postJson(
    origin,
    "/api/auth/sign-in/email",
    { email: creds.email, password: creds.password },
    jar
  )
  if (!signIn.ok) {
    const body = await signIn.text()
    throw new Error(
      `e2e auth-setup: sign-in failed (${signIn.status}): ${body}`
    )
  }

  const setActive = await postJson(
    origin,
    "/api/auth/organization/set-active",
    { organizationId: fixtures.organizationId },
    jar
  )
  if (!setActive.ok) {
    const body = await setActive.text()
    throw new Error(
      `e2e auth-setup: set-active org failed (${setActive.status}): ${body}`
    )
  }

  const enriched: E2eFixtures = { ...fixtures }

  const customerRes = await postJson(
    origin,
    "/api/customers",
    { name: creds.customerName },
    jar
  )
  if (customerRes.ok) {
    const body = await readJsonSafe<{ id?: string }>(customerRes)
    if (body?.id) {
      enriched.customerId = body.id
      console.log(`e2e auth-setup: customer ${body.id}`)
    }
  } else {
    console.warn(
      `e2e auth-setup: skip customer seed (${customerRes.status}) — CRM may be down`
    )
  }

  const quoteRes = await postJson(origin, "/api/quotes", {}, jar)
  if (quoteRes.ok) {
    const body = await readJsonSafe<{ id?: string }>(quoteRes)
    if (body?.id) {
      enriched.quoteId = body.id
      console.log(`e2e auth-setup: quote ${body.id}`)
    }
  } else {
    console.warn(
      `e2e auth-setup: skip quote seed (${quoteRes.status}) — quotes may be down`
    )
  }

  writeFileSync(fixturesPath, `${JSON.stringify(enriched, null, 2)}\n`, "utf8")
  writeFileSync(
    storageState,
    `${JSON.stringify(toStorageState(jar, origin), null, 2)}\n`,
    "utf8"
  )
  console.log(`e2e auth-setup: wrote ${storageState}`)
  return enriched
}
