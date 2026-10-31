import "server-only"

import type { CreateCustomerResponse, FormOption } from "@starboard/lib-contracts"

import { type CrmClient, getCrmClient } from "@/lib/domain/crm/crm.client"

export class CrmManager {
  constructor(private readonly crmClient: CrmClient = getCrmClient()) {}

  async listCustomerOptions(
    organizationId: string,
    requestId?: string
  ): Promise<FormOption[]> {
    return this.crmClient.listCustomers(organizationId, requestId)
  }

  async createCustomerForOrg(
    organizationId: string,
    name: string,
    requestId?: string
  ): Promise<CreateCustomerResponse> {
    return this.crmClient.createCustomer(organizationId, name, requestId)
  }

  async getCustomerNamesByIds(
    organizationId: string,
    ids: string[],
    requestId?: string
  ): Promise<Map<string, string>> {
    return this.crmClient.getCustomerNamesByIds(organizationId, ids, requestId)
  }
}

let crmManager: CrmManager = new CrmManager()

export function getCrmManager(): CrmManager {
  return crmManager
}

export function setCrmManager(manager: CrmManager) {
  crmManager = manager
}
