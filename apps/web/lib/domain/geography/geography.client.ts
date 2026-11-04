import "server-only"

import {
  addressDetailsResponseSchema,
  fxLatestResponseSchema,
  listAddressesResponseSchema,
  listPortsResponseSchema,
  type AddressPrediction,
  type DoorAddress,
  type FacilityOption,
  type FormOption,
  type FxLatestResponse,
} from "@starboard/lib-contracts"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
} from "@/lib/clients/http"

export type PortSearchFilters = { country?: string; type?: string }

export interface GeographyClient {
  listCurrencyOptions(requestId?: string): Promise<FormOption[]>
  ensureCurrency(code: string, requestId?: string): Promise<void>
  /** Latest Frankfurter rates for a base currency (server-side fetch). */
  getFxRates(base: string, requestId?: string): Promise<FxLatestResponse>
  searchPorts(
    q?: string,
    filters?: PortSearchFilters,
    requestId?: string
  ): Promise<FacilityOption[]>
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

  async getFxRates(
    base: string,
    requestId?: string
  ): Promise<FxLatestResponse> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      requestId,
    })
    const params = new URLSearchParams({ base: base.trim().toUpperCase() })
    const response = await serviceFetch(
      `/fx/latest?${params}`,
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(response, "Failed to load FX rates")
    const parsed = fxLatestResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to load FX rates: invalid response")
    }
    return parsed.data
  }

  async searchPorts(
    q = "",
    filters: PortSearchFilters = {},
    requestId?: string
  ): Promise<FacilityOption[]> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      requestId,
    })
    const params = new URLSearchParams()
    if (q.trim()) {
      params.set("q", q.trim())
    }
    if (filters.country?.trim()) params.set("country", filters.country.trim())
    if (filters.type?.trim()) params.set("type", filters.type.trim())
    const path = params.size > 0 ? `/ports?${params}` : "/ports"
    const response = await serviceFetch(path, { method: "GET" }, options)
    const body = await parseJsonResponse(response, "Failed to search ports")
    const parsed = listPortsResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to search ports: invalid response")
    }
    return parsed.data.ports
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
