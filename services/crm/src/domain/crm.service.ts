import {
  createCustomerRequestSchema,
  getCustomerNamesQuerySchema,
  type CreateCustomerResponse,
  type FormOption,
} from "@starboard/lib-contracts"

import type { CrmDao } from "../dao/crm.dao"

export interface CrmService {
  list(organizationId: string): Promise<FormOption[]>
  create(organizationId: string, name: string): Promise<CreateCustomerResponse>
  getNamesByIds(
    organizationId: string,
    ids: string[]
  ): Promise<Array<{ id: string; name: string }>>
}

export class DefaultCrmService implements CrmService {
  constructor(private readonly dao: CrmDao) {}

  async list(organizationId: string): Promise<FormOption[]> {
    const orgId = organizationId.trim()
    if (!orgId) {
      throw new CrmValidationError("organizationId is required")
    }
    return this.dao.listByOrganization(orgId)
  }

  async create(
    organizationId: string,
    name: string
  ): Promise<CreateCustomerResponse> {
    const orgId = organizationId.trim()
    if (!orgId) {
      throw new CrmValidationError("organizationId is required")
    }

    const parsed = createCustomerRequestSchema.safeParse({ name })
    if (!parsed.success) {
      throw new CrmValidationError(
        parsed.error.issues[0]?.message ?? "Invalid customer name"
      )
    }

    const created = await this.dao.insert({
      id: crypto.randomUUID(),
      organizationId: orgId,
      name: parsed.data.name,
    })

    return { id: created.id, name: created.name }
  }

  async getNamesByIds(
    organizationId: string,
    ids: string[]
  ): Promise<Array<{ id: string; name: string }>> {
    const orgId = organizationId.trim()
    if (!orgId) {
      throw new CrmValidationError("organizationId is required")
    }

    const parsed = getCustomerNamesQuerySchema.safeParse({
      ids: ids.join(","),
    })
    if (!parsed.success) {
      throw new CrmValidationError(
        parsed.error.issues[0]?.message ?? "Invalid customer ids"
      )
    }

    return this.dao.getNamesByIds(orgId, parsed.data.ids)
  }
}

export class CrmValidationError extends Error {
  readonly status = 400 as const
}
