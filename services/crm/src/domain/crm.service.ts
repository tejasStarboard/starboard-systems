import {
  createContactRequestSchema,
  createCustomerRequestSchema,
  getCustomerNamesQuerySchema,
  updateContactRequestSchema,
  updateCustomerRequestSchema,
  type ContactRecord,
  type CreateContactRequest,
  type CreateCustomerRequestInput,
  type CreateCustomerResponse,
  type FormOption,
  type UpdateContactRequest,
  type UpdateCustomerRequest,
} from "@starboard/lib-contracts"

import type { CrmDao, CustomerRow } from "../dao/crm.dao"

function toCustomerRecord(row: CustomerRow): CreateCustomerResponse {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    isCustomer: row.isCustomer,
    isVendor: row.isVendor,
  }
}

function toContactRecord(row: {
  id: string
  customerId: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
}): ContactRecord {
  return {
    id: row.id,
    customerId: row.customerId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
  }
}

export interface CrmService {
  list(organizationId: string): Promise<FormOption[]>
  listRecords(organizationId: string): Promise<CreateCustomerResponse[]>
  get(
    organizationId: string,
    customerId: string
  ): Promise<CreateCustomerResponse>
  create(
    organizationId: string,
    input: CreateCustomerRequestInput
  ): Promise<CreateCustomerResponse>
  update(
    organizationId: string,
    customerId: string,
    input: UpdateCustomerRequest
  ): Promise<CreateCustomerResponse>
  getNamesByIds(
    organizationId: string,
    ids: string[]
  ): Promise<Array<{ id: string; name: string }>>
  listContacts(
    organizationId: string,
    customerId: string
  ): Promise<ContactRecord[]>
  createContact(
    organizationId: string,
    customerId: string,
    input: CreateContactRequest
  ): Promise<ContactRecord>
  updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    input: UpdateContactRequest
  ): Promise<ContactRecord>
  deleteContact(
    organizationId: string,
    customerId: string,
    contactId: string
  ): Promise<void>
}

export class DefaultCrmService implements CrmService {
  constructor(private readonly dao: CrmDao) {}

  private requireOrg(organizationId: string): string {
    const orgId = organizationId.trim()
    if (!orgId) {
      throw new CrmValidationError("organizationId is required")
    }
    return orgId
  }

  private async requireCustomer(organizationId: string, customerId: string) {
    const row = await this.dao.getById(organizationId, customerId)
    if (!row) {
      throw new CrmNotFoundError("Customer not found")
    }
    return row
  }

  async list(organizationId: string): Promise<FormOption[]> {
    return this.dao.listOptionsByOrganization(this.requireOrg(organizationId))
  }

  async listRecords(organizationId: string): Promise<CreateCustomerResponse[]> {
    const rows = await this.dao.listRecordsByOrganization(
      this.requireOrg(organizationId)
    )
    return rows.map(toCustomerRecord)
  }

  async get(
    organizationId: string,
    customerId: string
  ): Promise<CreateCustomerResponse> {
    const orgId = this.requireOrg(organizationId)
    const row = await this.requireCustomer(orgId, customerId)
    return toCustomerRecord(row)
  }

  async create(
    organizationId: string,
    input: CreateCustomerRequestInput
  ): Promise<CreateCustomerResponse> {
    const orgId = this.requireOrg(organizationId)
    const parsed = createCustomerRequestSchema.safeParse(input)
    if (!parsed.success) {
      throw new CrmValidationError(
        parsed.error.issues[0]?.message ?? "Invalid customer"
      )
    }

    const created = await this.dao.insert({
      id: crypto.randomUUID(),
      organizationId: orgId,
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      isCustomer: parsed.data.isCustomer,
      isVendor: parsed.data.isVendor,
    })

    return toCustomerRecord(created)
  }

  async update(
    organizationId: string,
    customerId: string,
    input: UpdateCustomerRequest
  ): Promise<CreateCustomerResponse> {
    const orgId = this.requireOrg(organizationId)
    await this.requireCustomer(orgId, customerId)

    const parsed = updateCustomerRequestSchema.safeParse(input)
    if (!parsed.success) {
      throw new CrmValidationError(
        parsed.error.issues[0]?.message ?? "Invalid customer update"
      )
    }

    if (Object.keys(parsed.data).length === 0) {
      throw new CrmValidationError("No fields to update")
    }

    const updated = await this.dao.update(orgId, customerId, parsed.data)
    if (!updated) {
      throw new CrmNotFoundError("Customer not found")
    }
    return toCustomerRecord(updated)
  }

  async getNamesByIds(
    organizationId: string,
    ids: string[]
  ): Promise<Array<{ id: string; name: string }>> {
    const orgId = this.requireOrg(organizationId)
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

  async listContacts(
    organizationId: string,
    customerId: string
  ): Promise<ContactRecord[]> {
    const orgId = this.requireOrg(organizationId)
    await this.requireCustomer(orgId, customerId)
    const rows = await this.dao.listContacts(orgId, customerId)
    return rows.map(toContactRecord)
  }

  async createContact(
    organizationId: string,
    customerId: string,
    input: CreateContactRequest
  ): Promise<ContactRecord> {
    const orgId = this.requireOrg(organizationId)
    await this.requireCustomer(orgId, customerId)

    const parsed = createContactRequestSchema.safeParse(input)
    if (!parsed.success) {
      throw new CrmValidationError(
        parsed.error.issues[0]?.message ?? "Invalid contact"
      )
    }

    const created = await this.dao.insertContact({
      id: crypto.randomUUID(),
      organizationId: orgId,
      customerId,
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      role: parsed.data.role ?? null,
    })

    return toContactRecord(created)
  }

  async updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    input: UpdateContactRequest
  ): Promise<ContactRecord> {
    const orgId = this.requireOrg(organizationId)
    await this.requireCustomer(orgId, customerId)

    const parsed = updateContactRequestSchema.safeParse(input)
    if (!parsed.success) {
      throw new CrmValidationError(
        parsed.error.issues[0]?.message ?? "Invalid contact update"
      )
    }

    if (Object.keys(parsed.data).length === 0) {
      throw new CrmValidationError("No fields to update")
    }

    const updated = await this.dao.updateContact(
      orgId,
      customerId,
      contactId,
      parsed.data
    )
    if (!updated) {
      throw new CrmNotFoundError("Contact not found")
    }
    return toContactRecord(updated)
  }

  async deleteContact(
    organizationId: string,
    customerId: string,
    contactId: string
  ): Promise<void> {
    const orgId = this.requireOrg(organizationId)
    await this.requireCustomer(orgId, customerId)
    const deleted = await this.dao.deleteContact(orgId, customerId, contactId)
    if (!deleted) {
      throw new CrmNotFoundError("Contact not found")
    }
  }
}

export class CrmValidationError extends Error {
  readonly status = 400 as const
}

export class CrmNotFoundError extends Error {
  readonly status = 404 as const
}
