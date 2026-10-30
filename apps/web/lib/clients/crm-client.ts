import "server-only"

import {
  createCustomerResponseSchema,
  getCustomerNamesResponseSchema,
  listCustomersResponseSchema,
  type CreateCustomerResponse,
  type FormOption,
} from "@starboard/contracts"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
} from "@/lib/clients/http"

export interface CrmClient {
  listCustomers(
    organizationId: string,
    requestId?: string
  ): Promise<FormOption[]>
  createCustomer(
    organizationId: string,
    name: string,
    requestId?: string
  ): Promise<CreateCustomerResponse>
  getCustomerNamesByIds(
    organizationId: string,
    ids: string[],
    requestId?: string
  ): Promise<Map<string, string>>
}

class HttpCrmClient implements CrmClient {
  async listCustomers(
    organizationId: string,
    requestId?: string
  ): Promise<FormOption[]> {
    const options = createServiceOptions({
      baseUrl: env.CRM_SERVICE_URL,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      "/customers",
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(response, "Failed to list customers")
    const parsed = listCustomersResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to list customers: invalid response")
    }
    return parsed.data.customers
  }

  async createCustomer(
    organizationId: string,
    name: string,
    requestId?: string
  ): Promise<CreateCustomerResponse> {
    const options = createServiceOptions({
      baseUrl: env.CRM_SERVICE_URL,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      "/customers",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
      options
    )
    const body = await parseJsonResponse(response, "Failed to create customer")
    const parsed = createCustomerResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to create customer: invalid response")
    }
    return parsed.data
  }

  async getCustomerNamesByIds(
    organizationId: string,
    ids: string[],
    requestId?: string
  ): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter(Boolean))]
    if (unique.length === 0) {
      return new Map()
    }

    const options = createServiceOptions({
      baseUrl: env.CRM_SERVICE_URL,
      organizationId,
      requestId,
    })
    const params = new URLSearchParams({ ids: unique.join(",") })
    const response = await serviceFetch(
      `/customers/names?${params}`,
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(
      response,
      "Failed to resolve customer names"
    )
    const parsed = getCustomerNamesResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to resolve customer names: invalid response")
    }
    return new Map(parsed.data.customers.map((row) => [row.id, row.name]))
  }
}

let crmClient: CrmClient = new HttpCrmClient()

export function getCrmClient(): CrmClient {
  return crmClient
}

export function setCrmClient(client: CrmClient) {
  crmClient = client
}
