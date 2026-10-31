import "server-only"

import type {
  ContactRecord,
  CreateContactRequest,
  CreateCustomerRequestInput,
  CreateCustomerResponse,
  FormOption,
  UpdateContactRequest,
  UpdateCustomerRequest,
} from "@starboard/lib-contracts"

import { type CrmClient, getCrmClient } from "@/lib/domain/crm/crm.client"

export class CrmManager {
  constructor(private readonly crmClient: CrmClient = getCrmClient()) {}

  async listCustomerOptions(
    organizationId: string,
    requestId?: string
  ): Promise<FormOption[]> {
    return this.crmClient.listCustomers(organizationId, requestId)
  }

  async listCustomerRecords(
    organizationId: string,
    requestId?: string
  ): Promise<CreateCustomerResponse[]> {
    return this.crmClient.listCustomerRecords(organizationId, requestId)
  }

  async getCustomer(
    organizationId: string,
    customerId: string,
    requestId?: string
  ): Promise<CreateCustomerResponse> {
    return this.crmClient.getCustomer(organizationId, customerId, requestId)
  }

  async createCustomerForOrg(
    organizationId: string,
    input: CreateCustomerRequestInput | string,
    requestId?: string
  ): Promise<CreateCustomerResponse> {
    const body: CreateCustomerRequestInput =
      typeof input === "string" ? { name: input } : input
    return this.crmClient.createCustomer(organizationId, body, requestId)
  }

  async updateCustomer(
    organizationId: string,
    customerId: string,
    input: UpdateCustomerRequest,
    requestId?: string
  ): Promise<CreateCustomerResponse> {
    return this.crmClient.updateCustomer(
      organizationId,
      customerId,
      input,
      requestId
    )
  }

  async getCustomerNamesByIds(
    organizationId: string,
    ids: string[],
    requestId?: string
  ): Promise<Map<string, string>> {
    return this.crmClient.getCustomerNamesByIds(organizationId, ids, requestId)
  }

  async listContacts(
    organizationId: string,
    customerId: string,
    requestId?: string
  ): Promise<ContactRecord[]> {
    return this.crmClient.listContacts(organizationId, customerId, requestId)
  }

  async createContact(
    organizationId: string,
    customerId: string,
    input: CreateContactRequest,
    requestId?: string
  ): Promise<ContactRecord> {
    return this.crmClient.createContact(
      organizationId,
      customerId,
      input,
      requestId
    )
  }

  async updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    input: UpdateContactRequest,
    requestId?: string
  ): Promise<ContactRecord> {
    return this.crmClient.updateContact(
      organizationId,
      customerId,
      contactId,
      input,
      requestId
    )
  }

  async deleteContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    requestId?: string
  ): Promise<void> {
    return this.crmClient.deleteContact(
      organizationId,
      customerId,
      contactId,
      requestId
    )
  }
}

let crmManager: CrmManager = new CrmManager()

export function getCrmManager(): CrmManager {
  return crmManager
}

export function setCrmManager(manager: CrmManager) {
  crmManager = manager
}
