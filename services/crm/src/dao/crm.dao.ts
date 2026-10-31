import { and, asc, eq, inArray } from "drizzle-orm"
import { contact, customer } from "@starboard/lib-db/schema"
import type { FormOption } from "@starboard/lib-contracts"

import type { CrmDb } from "./db"

export type CustomerRow = {
  id: string
  organizationId: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  countryCode: string | null
  zip: string | null
  isCustomer: boolean
  isVendor: boolean
  isActive: boolean
}

export type CustomerInsert = {
  id: string
  organizationId: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  countryCode: string | null
  zip: string | null
  isCustomer: boolean
  isVendor: boolean
  isActive: boolean
}

export type CustomerUpdate = {
  name?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  countryCode?: string | null
  zip?: string | null
  isCustomer?: boolean
  isVendor?: boolean
  isActive?: boolean
}

export type CustomerNameRow = {
  id: string
  name: string
}

export type ContactRow = {
  id: string
  organizationId: string
  customerId: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
}

export type ContactInsert = {
  id: string
  organizationId: string
  customerId: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
}

export type ContactUpdate = {
  name?: string
  email?: string | null
  phone?: string | null
  role?: string | null
}

export interface CrmDao {
  listOptionsByOrganization(organizationId: string): Promise<FormOption[]>
  listRecordsByOrganization(organizationId: string): Promise<CustomerRow[]>
  getById(
    organizationId: string,
    customerId: string
  ): Promise<CustomerRow | null>
  insert(row: CustomerInsert): Promise<CustomerRow>
  update(
    organizationId: string,
    customerId: string,
    patch: CustomerUpdate
  ): Promise<CustomerRow | null>
  getNamesByIds(
    organizationId: string,
    ids: string[]
  ): Promise<CustomerNameRow[]>
  listContacts(
    organizationId: string,
    customerId: string
  ): Promise<ContactRow[]>
  listContactsByOrganization(organizationId: string): Promise<ContactRow[]>
  getContactById(
    organizationId: string,
    customerId: string,
    contactId: string
  ): Promise<ContactRow | null>
  insertContact(row: ContactInsert): Promise<ContactRow>
  updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    patch: ContactUpdate
  ): Promise<ContactRow | null>
  deleteContact(
    organizationId: string,
    customerId: string,
    contactId: string
  ): Promise<boolean>
}

const customerColumns = {
  id: customer.id,
  organizationId: customer.organizationId,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  address: customer.address,
  city: customer.city,
  state: customer.state,
  countryCode: customer.countryCode,
  zip: customer.zip,
  isCustomer: customer.isCustomer,
  isVendor: customer.isVendor,
  isActive: customer.isActive,
} as const

const contactColumns = {
  id: contact.id,
  organizationId: contact.organizationId,
  customerId: contact.customerId,
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  role: contact.role,
} as const

export class DrizzleCrmDao implements CrmDao {
  constructor(private readonly db: CrmDb) {}

  async listOptionsByOrganization(
    organizationId: string
  ): Promise<FormOption[]> {
    const rows = await this.db
      .select({
        id: customer.id,
        name: customer.name,
      })
      .from(customer)
      .where(
        and(
          eq(customer.organizationId, organizationId),
          eq(customer.isActive, true)
        )
      )
      .orderBy(asc(customer.name))

    return rows.map((row) => ({
      value: row.id,
      label: row.name,
    }))
  }

  async listRecordsByOrganization(
    organizationId: string
  ): Promise<CustomerRow[]> {
    return this.db
      .select(customerColumns)
      .from(customer)
      .where(eq(customer.organizationId, organizationId))
      .orderBy(asc(customer.name))
  }

  async getById(
    organizationId: string,
    customerId: string
  ): Promise<CustomerRow | null> {
    const [row] = await this.db
      .select(customerColumns)
      .from(customer)
      .where(
        and(
          eq(customer.organizationId, organizationId),
          eq(customer.id, customerId)
        )
      )
      .limit(1)

    return row ?? null
  }

  async insert(row: CustomerInsert): Promise<CustomerRow> {
    const [created] = await this.db
      .insert(customer)
      .values({
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        countryCode: row.countryCode,
        zip: row.zip,
        isCustomer: row.isCustomer,
        isVendor: row.isVendor,
        isActive: row.isActive,
      })
      .returning(customerColumns)

    if (!created) {
      throw new Error("Failed to insert customer")
    }

    return created
  }

  async update(
    organizationId: string,
    customerId: string,
    patch: CustomerUpdate
  ): Promise<CustomerRow | null> {
    const [updated] = await this.db
      .update(customer)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customer.organizationId, organizationId),
          eq(customer.id, customerId)
        )
      )
      .returning(customerColumns)

    return updated ?? null
  }

  async getNamesByIds(
    organizationId: string,
    ids: string[]
  ): Promise<CustomerNameRow[]> {
    const unique = [...new Set(ids.filter(Boolean))]
    if (unique.length === 0) {
      return []
    }

    return this.db
      .select({
        id: customer.id,
        name: customer.name,
      })
      .from(customer)
      .where(
        and(
          eq(customer.organizationId, organizationId),
          inArray(customer.id, unique)
        )
      )
  }

  async listContacts(
    organizationId: string,
    customerId: string
  ): Promise<ContactRow[]> {
    return this.db
      .select(contactColumns)
      .from(contact)
      .where(
        and(
          eq(contact.organizationId, organizationId),
          eq(contact.customerId, customerId)
        )
      )
      .orderBy(asc(contact.name))
  }

  async listContactsByOrganization(
    organizationId: string
  ): Promise<ContactRow[]> {
    return this.db
      .select(contactColumns)
      .from(contact)
      .where(eq(contact.organizationId, organizationId))
      .orderBy(asc(contact.name))
  }

  async getContactById(
    organizationId: string,
    customerId: string,
    contactId: string
  ): Promise<ContactRow | null> {
    const [row] = await this.db
      .select(contactColumns)
      .from(contact)
      .where(
        and(
          eq(contact.organizationId, organizationId),
          eq(contact.customerId, customerId),
          eq(contact.id, contactId)
        )
      )
      .limit(1)

    return row ?? null
  }

  async insertContact(row: ContactInsert): Promise<ContactRow> {
    const [created] = await this.db
      .insert(contact)
      .values(row)
      .returning(contactColumns)

    if (!created) {
      throw new Error("Failed to insert contact")
    }

    return created
  }

  async updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    patch: ContactUpdate
  ): Promise<ContactRow | null> {
    const [updated] = await this.db
      .update(contact)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contact.organizationId, organizationId),
          eq(contact.customerId, customerId),
          eq(contact.id, contactId)
        )
      )
      .returning(contactColumns)

    return updated ?? null
  }

  async deleteContact(
    organizationId: string,
    customerId: string,
    contactId: string
  ): Promise<boolean> {
    const deleted = await this.db
      .delete(contact)
      .where(
        and(
          eq(contact.organizationId, organizationId),
          eq(contact.customerId, customerId),
          eq(contact.id, contactId)
        )
      )
      .returning({ id: contact.id })

    return deleted.length > 0
  }
}
