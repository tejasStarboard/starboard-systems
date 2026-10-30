import "server-only"

import type { CreateCustomerResponse, FormOption } from "@starboard/contracts"

import { getCrmClient } from "@/lib/clients/crm-client"

export async function listCustomerOptions(
  organizationId: string,
  requestId?: string
): Promise<FormOption[]> {
  return getCrmClient().listCustomers(organizationId, requestId)
}

export async function createCustomerForOrg(
  organizationId: string,
  name: string,
  requestId?: string
): Promise<CreateCustomerResponse> {
  return getCrmClient().createCustomer(organizationId, name, requestId)
}

export async function getCustomerNamesByIds(
  organizationId: string,
  ids: string[],
  requestId?: string
): Promise<Map<string, string>> {
  return getCrmClient().getCustomerNamesByIds(organizationId, ids, requestId)
}
