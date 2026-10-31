import "server-only"

import {
  listQuotesResponseSchema,
  type CreateQuoteRequest,
  type FormOption,
  type ListQuotesResponse,
  type QuoteFormValues,
  type QuotesListQueryInput,
  type QuoteSource,
} from "@starboard/lib-contracts"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
  ServiceClientError,
} from "@/lib/clients/http"

export interface QuotesClient {
  listQuotes(
    organizationId: string,
    query?: QuotesListQueryInput,
    requestId?: string
  ): Promise<ListQuotesResponse>
  getQuoteFormValues(
    quoteId: string,
    organizationId: string,
    requestId?: string
  ): Promise<QuoteFormValues | null>
  createQuote(
    input: CreateQuoteRequest,
    requestId?: string
  ): Promise<{ id: string }>
  saveQuote(
    values: QuoteFormValues,
    input: { ownerId: string; organizationId: string },
    requestId?: string
  ): Promise<{ id: string }>
  listContainerTypeOptions(requestId?: string): Promise<FormOption[]>
  listPalletTypeOptions(requestId?: string): Promise<FormOption[]>
}

class HttpQuotesClient implements QuotesClient {
  constructor(
    private readonly options: { baseUrl: string } = {
      baseUrl: env.QUOTES_SERVICE_URL,
    }
  ) {}

  async listQuotes(
    organizationId: string,
    query?: QuotesListQueryInput,
    requestId?: string
  ): Promise<ListQuotesResponse> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const params = new URLSearchParams()
    if (query?.page != null) params.set("page", String(query.page))
    if (query?.pageSize != null) params.set("pageSize", String(query.pageSize))
    if (query?.q) params.set("q", String(query.q))
    const queryString = params.toString()
    const response = await serviceFetch(
      `/quotes${queryString ? `?${queryString}` : ""}`,
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(response, "Failed to list quotes")
    const parsed = listQuotesResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to list quotes: invalid response")
    }
    return parsed.data
  }

  async getQuoteFormValues(
    quoteId: string,
    organizationId: string,
    requestId?: string
  ): Promise<QuoteFormValues | null> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    try {
      const response = await serviceFetch(
        `/quotes/${encodeURIComponent(quoteId)}`,
        { method: "GET" },
        options
      )
      const body = await parseJsonResponse<{ quote: QuoteFormValues }>(
        response,
        "Failed to load quote"
      )
      return body.quote
    } catch (error) {
      if (error instanceof ServiceClientError && error.status === 404) {
        return null
      }
      throw error
    }
  }

  async createQuote(
    input: CreateQuoteRequest,
    requestId?: string
  ): Promise<{ id: string }> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId: input.organizationId,
      requestId,
    })
    const response = await serviceFetch(
      "/quotes",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      options
    )
    return parseJsonResponse(response, "Failed to create quote")
  }

  async saveQuote(
    values: QuoteFormValues,
    input: { ownerId: string; organizationId: string },
    requestId?: string
  ): Promise<{ id: string }> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId: input.organizationId,
      requestId,
    })
    const response = await serviceFetch(
      `/quotes/${encodeURIComponent(values.id)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          ownerId: input.ownerId,
          organizationId: input.organizationId,
          quote: values,
        }),
      },
      options
    )
    return parseJsonResponse(response, "Failed to save quote")
  }

  async listContainerTypeOptions(requestId?: string): Promise<FormOption[]> {
    const options = createServiceOptions({
      baseUrl: env.QUOTES_SERVICE_URL,
      requestId,
    })
    const response = await serviceFetch(
      "/reference/container-types",
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse<{ containerTypes: FormOption[] }>(
      response,
      "Failed to list container types"
    )
    return body.containerTypes
  }

  async listPalletTypeOptions(requestId?: string): Promise<FormOption[]> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      requestId,
    })
    const response = await serviceFetch(
      "/reference/pallet-types",
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse<{ palletTypes: FormOption[] }>(
      response,
      "Failed to list pallet types"
    )
    return body.palletTypes
  }
}

let quotesClient: QuotesClient = new HttpQuotesClient()

export function getQuotesClient(): QuotesClient {
  return quotesClient
}

export function setQuotesClient(client: QuotesClient) {
  quotesClient = client
}

export type { QuoteSource }
