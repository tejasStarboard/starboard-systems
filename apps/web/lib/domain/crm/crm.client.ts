import "server-only"

import {
  createCustomerResponseSchema,
  getCustomerNamesResponseSchema,
  getCustomerResponseSchema,
  listContactsResponseSchema,
  listCustomerRecordsResponseSchema,
  listCustomersResponseSchema,
  contactRecordSchema,
  type ContactRecord,
  type CreateContactRequest,
  type CreateCustomerRequestInput,
  type CreateCustomerResponse,
  type CrmListQueryInput,
  type FormOption,
  type ListContactsResponse,
  type ListCustomerRecordsResponse,
  type UpdateContactRequest,
  type UpdateCustomerRequest,
} from "@starboard/lib-contracts"

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
  listCustomerRecords(
    organizationId: string,
    query?: CrmListQueryInput,
    requestId?: string
  ): Promise<ListCustomerRecordsResponse>
  getCustomer(
    organizationId: string,
    customerId: string,
    requestId?: string
  ): Promise<CreateCustomerResponse>
  createCustomer(
    organizationId: string,
    input: CreateCustomerRequestInput,
    requestId?: string
  ): Promise<CreateCustomerResponse>
  updateCustomer(
    organizationId: string,
    customerId: string,
    input: UpdateCustomerRequest,
    requestId?: string
  ): Promise<CreateCustomerResponse>
  getCustomerNamesByIds(
    organizationId: string,
    ids: string[],
    requestId?: string
  ): Promise<Map<string, string>>
  listContacts(
    organizationId: string,
    customerId: string,
    query?: CrmListQueryInput,
    requestId?: string
  ): Promise<ListContactsResponse>
  createContact(
    organizationId: string,
    customerId: string,
    input: CreateContactRequest,
    requestId?: string
  ): Promise<ContactRecord>
  updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    input: UpdateContactRequest,
    requestId?: string
  ): Promise<ContactRecord>
  deleteContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    requestId?: string
  ): Promise<void>
}

class HttpCrmClient implements CrmClient {
  constructor(
    private readonly options: { baseUrl: string } = {
      baseUrl: env.CRM_SERVICE_URL,
    }
  ) {}

  async listCustomers(
    organizationId: string,
    requestId?: string
  ): Promise<FormOption[]> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
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

  async listCustomerRecords(
    organizationId: string,
    query?: CrmListQueryInput,
    requestId?: string
  ): Promise<ListCustomerRecordsResponse> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const params = new URLSearchParams({ detail: "1" })
    if (query?.page != null) params.set("page", String(query.page))
    if (query?.pageSize != null) params.set("pageSize", String(query.pageSize))
    if (query?.q) params.set("q", String(query.q))
    const response = await serviceFetch(
      `/customers?${params}`,
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(response, "Failed to list customers")
    const parsed = listCustomerRecordsResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to list customers: invalid response")
    }
    return parsed.data
  }

  async getCustomer(
    organizationId: string,
    customerId: string,
    requestId?: string
  ): Promise<CreateCustomerResponse> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      `/customers/${encodeURIComponent(customerId)}`,
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(response, "Failed to get customer")
    const parsed = getCustomerResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to get customer: invalid response")
    }
    return parsed.data
  }

  async createCustomer(
    organizationId: string,
    input: CreateCustomerRequestInput,
    requestId?: string
  ): Promise<CreateCustomerResponse> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      "/customers",
      {
        method: "POST",
        body: JSON.stringify(input),
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

  async updateCustomer(
    organizationId: string,
    customerId: string,
    input: UpdateCustomerRequest,
    requestId?: string
  ): Promise<CreateCustomerResponse> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      `/customers/${encodeURIComponent(customerId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
      options
    )
    const body = await parseJsonResponse(response, "Failed to update customer")
    const parsed = createCustomerResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to update customer: invalid response")
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
      baseUrl: this.options.baseUrl,
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

  async listContacts(
    organizationId: string,
    customerId: string,
    query?: CrmListQueryInput,
    requestId?: string
  ): Promise<ListContactsResponse> {
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
      `/customers/${encodeURIComponent(customerId)}/contacts${
        queryString ? `?${queryString}` : ""
      }`,
      { method: "GET" },
      options
    )
    const body = await parseJsonResponse(response, "Failed to list contacts")
    const parsed = listContactsResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to list contacts: invalid response")
    }
    return parsed.data
  }

  async createContact(
    organizationId: string,
    customerId: string,
    input: CreateContactRequest,
    requestId?: string
  ): Promise<ContactRecord> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      `/customers/${encodeURIComponent(customerId)}/contacts`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      options
    )
    const body = await parseJsonResponse(response, "Failed to create contact")
    const parsed = contactRecordSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to create contact: invalid response")
    }
    return parsed.data
  }

  async updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    input: UpdateContactRequest,
    requestId?: string
  ): Promise<ContactRecord> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      `/customers/${encodeURIComponent(customerId)}/contacts/${encodeURIComponent(contactId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
      options
    )
    const body = await parseJsonResponse(response, "Failed to update contact")
    const parsed = contactRecordSchema.safeParse(body)
    if (!parsed.success) {
      throw new Error("Failed to update contact: invalid response")
    }
    return parsed.data
  }

  async deleteContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    requestId?: string
  ): Promise<void> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      `/customers/${encodeURIComponent(customerId)}/contacts/${encodeURIComponent(contactId)}`,
      { method: "DELETE" },
      options
    )
    if (!response.ok) {
      await parseJsonResponse(response, "Failed to delete contact")
    }
  }
}

let crmClient: CrmClient = new HttpCrmClient()

export function getCrmClient(): CrmClient {
  return crmClient
}

export function setCrmClient(client: CrmClient) {
  crmClient = client
}
