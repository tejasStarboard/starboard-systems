import "server-only"

import {
  createRateResponseSchema,
  getRateResponseSchema,
  listRatesResponseSchema,
  type CreateRateRequest,
  type CreateRateResponse,
  type GetRateResponse,
  type ListRatesQuery,
  type Rate,
} from "@starboard/contracts"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
} from "@/lib/clients/http"

export interface RatesClient {
  listRates(
    organizationId: string,
    query?: Partial<ListRatesQuery>,
    requestId?: string
  ): Promise<Rate[]>
  createRate(
    organizationId: string,
    payload: CreateRateRequest,
    requestId?: string
  ): Promise<CreateRateResponse>
  getRate(
    organizationId: string,
    rateId: string,
    requestId?: string
  ): Promise<GetRateResponse>
}

function buildListPath(query: Partial<ListRatesQuery> = {}): string {
  const params = new URLSearchParams()
  if (query.q) params.set("q", query.q)
  if (query.origin) params.set("origin", query.origin)
  if (query.destination) params.set("destination", query.destination)
  if (query.customerId) params.set("customerId", query.customerId)
  if (query.validAt) params.set("validAt", query.validAt)
  const qs = params.toString()
  return qs ? `/rates?${qs}` : "/rates"
}

class HttpRatesClient implements RatesClient {
  constructor(
    private readonly options: { baseUrl: string } = {
      baseUrl: env.RATES_SERVICE_URL,
    }
  ) {}

  async listRates(
    organizationId: string,
    query: Partial<ListRatesQuery> = {},
    requestId?: string
  ): Promise<Rate[]> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      buildListPath(query),
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(response, "Failed to list rates")
    const parsed = listRatesResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to list rates: invalid response")
    }
    return parsed.data.rates
  }

  async createRate(
    organizationId: string,
    payload: CreateRateRequest,
    requestId?: string
  ): Promise<CreateRateResponse> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      "/rates",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      options
    )
    const body = await parseJsonResponse(response, "Failed to create rate")
    const parsed = createRateResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to create rate: invalid response")
    }
    return parsed.data
  }

  async getRate(
    organizationId: string,
    rateId: string,
    requestId?: string
  ): Promise<GetRateResponse> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      `/rates/${encodeURIComponent(rateId)}`,
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(response, "Failed to get rate")
    const parsed = getRateResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to get rate: invalid response")
    }
    return parsed.data
  }
}

let ratesClient: RatesClient = new HttpRatesClient()

export function getRatesClient(): RatesClient {
  return ratesClient
}

export function setRatesClient(client: RatesClient) {
  ratesClient = client
}
