import "server-only"

import type { FormOption } from "@starboard/contracts"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
} from "@/lib/clients/http"

export interface GeographyClient {
  listCurrencyOptions(requestId?: string): Promise<FormOption[]>
  ensureCurrency(code: string, requestId?: string): Promise<void>
}

class HttpGeographyClient implements GeographyClient {
  async listCurrencyOptions(requestId?: string): Promise<FormOption[]> {
    const options = createServiceOptions({
      baseUrl: env.GEOGRAPHY_SERVICE_URL,
      requestId,
    })
    const response = await serviceFetch("/currencies", { method: "GET" }, options)
    const body = await parseJsonResponse<{ currencies: FormOption[] }>(
      response,
      "Failed to list currencies"
    )
    return body.currencies
  }

  async ensureCurrency(code: string, requestId?: string): Promise<void> {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return

    const options = createServiceOptions({
      baseUrl: env.GEOGRAPHY_SERVICE_URL,
      requestId,
    })
    const response = await serviceFetch(
      "/currencies",
      {
        method: "POST",
        body: JSON.stringify({ code: normalized }),
      },
      options
    )
    await parseJsonResponse(response, "Failed to ensure currency")
  }
}

let geographyClient: GeographyClient = new HttpGeographyClient()

export function getGeographyClient(): GeographyClient {
  return geographyClient
}

export function setGeographyClient(client: GeographyClient) {
  geographyClient = client
}
