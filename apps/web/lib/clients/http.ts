import {
  REQUEST_ID_HEADER,
  serviceFetch,
  type ServiceFetchOptions,
} from "@starboard/lib-service-kit"

import { env } from "@/env"

export function createServiceOptions(input?: {
  requestId?: string
  organizationId?: string
  baseUrl: string
}): ServiceFetchOptions {
  return {
    baseUrl: input!.baseUrl,
    serviceToken: env.INTERNAL_SERVICE_TOKEN,
    timeoutMs: 10_000,
    requestId: input?.requestId ?? crypto.randomUUID(),
    organizationId: input?.organizationId,
  }
}

export class ServiceClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId?: string
  ) {
    super(message)
  }
}

export async function parseJsonResponse<T>(
  response: Response,
  fallbackError: string
): Promise<T> {
  const requestId = response.headers.get(REQUEST_ID_HEADER) ?? undefined
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ServiceClientError(
      fallbackError,
      response.status || 502,
      requestId
    )
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : fallbackError
    throw new ServiceClientError(message, response.status, requestId)
  }

  return body as T
}

export { serviceFetch }
