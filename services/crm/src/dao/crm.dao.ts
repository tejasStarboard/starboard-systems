import { and, asc, eq, inArray } from "drizzle-orm"
import { customer } from "@starboard/db/schema"
import type { FormOption } from "@starboard/contracts"

import type { CrmDb } from "./db"

export type CustomerInsert = {
  id: string
  organizationId: string
  name: string
}

export type CustomerNameRow = {
  id: string
  name: string
}

export interface CrmDao {
  listByOrganization(organizationId: string): Promise<FormOption[]>
  insert(row: CustomerInsert): Promise<CustomerNameRow>
  getNamesByIds(
    organizationId: string,
    ids: string[]
  ): Promise<CustomerNameRow[]>
}

export class DrizzleCrmDao implements CrmDao {
  constructor(private readonly db: CrmDb) {}

  async listByOrganization(organizationId: string): Promise<FormOption[]> {
    const rows = await this.db
      .select({
        id: customer.id,
        name: customer.name,
      })
      .from(customer)
      .where(eq(customer.organizationId, organizationId))
      .orderBy(asc(customer.name))

    return rows.map((row) => ({
      value: row.id,
      label: row.name,
    }))
  }

  async insert(row: CustomerInsert): Promise<CustomerNameRow> {
    const [created] = await this.db
      .insert(customer)
      .values({
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
      })
      .returning({
        id: customer.id,
        name: customer.name,
      })

    if (!created) {
      throw new Error("Failed to insert customer")
    }

    return created
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
}
