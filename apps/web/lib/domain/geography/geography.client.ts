import "server-only"

import {
  addressDetailsResponseSchema,
  listAddressesResponseSchema,
  listPortsResponseSchema,
  type AddressPrediction,
  type DoorAddress,
  type FormOption,
} from "@starboard/lib-contracts"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
} from "@/lib/clients/http"

export interface GeographyClient {
  listCurrencyOptions(requestId?: string): Promise<FormOption[]>
  ensureCurrency(code: string, requestId?: string): Promise<void>
  searchPorts(q?: string, requestId?: string): Promise<FormOption[]>
  searchAddresses(q?: string, requestId?: string): Promise<AddressPrediction[]>
  getAddressDetails(placeId: string, requestId?: string): Promise<DoorAddress>
}

class HttpGeographyClient implements GeographyClient {
  constructor(
    private readonly options: { baseUrl: string } = {
      baseUrl: env.GEOGRAPHY_SERVICE_URL,
    }
  ) {}

  async listCurrencyOptions(requestId?: string): Promise<FormOption[]> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      requestId,
    })
    const response = await serviceFetch(
      "/currencies",
      { method: "GET" },
      options
    )
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
      baseUrl: this.options.baseUrl,
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

  async searchPorts(q = "", requestId?: string): Promise<FormOption[]> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      requestId,
    })
    const params = new URLSearchParams()
    if (q.trim()) {
      params.set("q", q.trim())
    }
    const path = params.size > 0 ? `/ports?${params}` : "/ports"
    const response = await serviceFetch(path, { method: "GET" }, options)
    const body = await parseJsonResponse(response, "Failed to search ports")
    const parsed = listPortsResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to search ports: invalid response")
    }
    return parsed.data.ports.map(({ value, label }) => ({ value, label }))
  }

  async searchAddresses(
    q = "",
    requestId?: string
  ): Promise<AddressPrediction[]> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      requestId,
    })
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    const path = params.size > 0 ? `/addresses?${params}` : "/addresses"
    const response = await serviceFetch(path, { method: "GET" }, options)
    const body = await parseJsonResponse(response, "Failed to search addresses")
    const parsed = listAddressesResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to search addresses: invalid response")
    }
    return parsed.data.addresses
  }

  async getAddressDetails(
    placeId: string,
    requestId?: string
  ): Promise<DoorAddress> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      requestId,
    })
    const params = new URLSearchParams({ placeId })
    const response = await serviceFetch(
      `/addresses/details?${params}`,
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(
      response,
      "Failed to load address details"
    )
    const parsed = addressDetailsResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to load address details: invalid response")
    }
    return parsed.data.address
  }
}

let geographyClient: GeographyClient = new HttpGeographyClient()

export function getGeographyClient(): GeographyClient {
  return geographyClient
}

export function setGeographyClient(client: GeographyClient) {
  geographyClient = client
}
