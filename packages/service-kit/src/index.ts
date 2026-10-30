import { createMiddleware } from "hono/factory"

export const REQUEST_ID_HEADER = "x-request-id"
export const ORG_ID_HEADER = "x-organization-id"
export const SERVICE_AUTH_HEADER = "authorization"

export type ServiceVariables = {
  requestId: string
  organizationId?: string
}

export function createRequestIdMiddleware() {
  return createMiddleware<{ Variables: ServiceVariables }>(async (c, next) => {
    const incoming = c.req.header(REQUEST_ID_HEADER)
    const requestId = incoming?.trim() || crypto.randomUUID()
    c.set("requestId", requestId)
    c.header(REQUEST_ID_HEADER, requestId)
    await next()
  })
}

export function createServiceTokenMiddleware(expectedToken: string) {
  return createMiddleware<{ Variables: ServiceVariables }>(async (c, next) => {
    const header = c.req.header(SERVICE_AUTH_HEADER)
    const token = header?.startsWith("Bearer ")
      ? header.slice("Bearer ".length).trim()
      : header?.trim()

    if (!expectedToken || token !== expectedToken) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    const organizationId = c.req.header(ORG_ID_HEADER)?.trim()
    if (organizationId) {
      c.set("organizationId", organizationId)
    }

    await next()
  })
}

export function logInfo(
  service: string,
  requestId: string,
  message: string,
  extra?: Record<string, unknown>
) {
  console.log(
    JSON.stringify({
      level: "info",
      service,
      requestId,
      message,
      ...extra,
      ts: new Date().toISOString(),
    })
  )
}

export function logError(
  service: string,
  requestId: string,
  message: string,
  extra?: Record<string, unknown>
) {
  console.error(
    JSON.stringify({
      level: "error",
      service,
      requestId,
      message,
      ...extra,
      ts: new Date().toISOString(),
    })
  )
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "operation"
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export type ServiceFetchOptions = {
  baseUrl: string
  serviceToken: string
  timeoutMs?: number
  requestId?: string
  organizationId?: string
}

export async function serviceFetch(
  path: string,
  init: RequestInit,
  options: ServiceFetchOptions
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 10_000
  const headers = new Headers(init.headers)
  headers.set(SERVICE_AUTH_HEADER, `Bearer ${options.serviceToken}`)
  if (options.requestId) {
    headers.set(REQUEST_ID_HEADER, options.requestId)
  }
  if (options.organizationId) {
    headers.set(ORG_ID_HEADER, options.organizationId)
  }
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json")
  }

  const url = `${options.baseUrl.replace(/\/$/, "")}${path}`
  const method = init.method ?? "GET"

  return withTimeout(
    fetch(url, { ...init, headers }),
    timeoutMs,
    `${method} ${url}`
  )
}
