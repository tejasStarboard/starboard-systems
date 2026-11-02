import { and, asc, eq, gte, ilike, lte, or, SQL } from "drizzle-orm"
import { rateCatalog } from "@starboard/lib-db/schema"
import type { LaneMode, RateSource } from "@starboard/lib-contracts"

import type { RatesDb } from "./db"

export type RateRow = {
  id: string
  organizationId: string
  origin: string | null
  destination: string | null
  customerId: string | null
  mode: LaneMode
  carrier: string | null
  label: string
  currencyCode: string
  amount: number
  validFrom: Date
  validTo: Date
  source: RateSource
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type RateInsert = {
  id: string
  organizationId: string
  origin: string | null
  destination: string | null
  customerId: string | null
  mode: LaneMode
  carrier: string | null
  label: string
  currencyCode: string
  amount: number
  validFrom: Date
  validTo: Date
  source: RateSource
  isActive?: boolean
}

export type RateUpdate = {
  origin?: string | null
  destination?: string | null
  customerId?: string | null
  mode?: LaneMode
  carrier?: string | null
  label?: string
  currencyCode?: string
  amount?: number
  validFrom?: Date
  validTo?: Date
  isActive?: boolean
}

export type ListRatesFilters = {
  q?: string
  origin?: string
  destination?: string
  customerId?: string
  validAt?: Date | null
  includeInactive?: boolean
}

export interface RatesDao {
  listByOrganization(
    organizationId: string,
    filters: ListRatesFilters
  ): Promise<RateRow[]>
  insert(row: RateInsert): Promise<RateRow>
  getById(organizationId: string, id: string): Promise<RateRow | null>
  update(
    organizationId: string,
    id: string,
    patch: RateUpdate
  ): Promise<RateRow | null>
  delete(organizationId: string, id: string): Promise<boolean>
}

export class DrizzleRatesDao implements RatesDao {
  constructor(private readonly db: RatesDb) {}

  async listByOrganization(
    organizationId: string,
    filters: ListRatesFilters
  ): Promise<RateRow[]> {
    const conditions: SQL[] = [eq(rateCatalog.organizationId, organizationId)]

    if (!filters.includeInactive) {
      conditions.push(eq(rateCatalog.isActive, true))
    }

    const q = filters.q?.trim()
    if (q) {
      const pattern = `%${q}%`
      conditions.push(
        or(
          ilike(rateCatalog.label, pattern),
          ilike(rateCatalog.carrier, pattern)
        )!
      )
    }

    const origin = filters.origin?.trim()
    if (origin) {
      conditions.push(eq(rateCatalog.origin, origin))
    }

    const destination = filters.destination?.trim()
    if (destination) {
      conditions.push(eq(rateCatalog.destination, destination))
    }

    const customerId = filters.customerId?.trim()
    if (customerId) {
      conditions.push(eq(rateCatalog.customerId, customerId))
    }

    if (filters.validAt) {
      conditions.push(lte(rateCatalog.validFrom, filters.validAt))
      conditions.push(gte(rateCatalog.validTo, filters.validAt))
    }

    return this.db
      .select()
      .from(rateCatalog)
      .where(and(...conditions))
      .orderBy(asc(rateCatalog.label))
  }

  async insert(row: RateInsert): Promise<RateRow> {
    const [created] = await this.db
      .insert(rateCatalog)
      .values({
        id: row.id,
        organizationId: row.organizationId,
        origin: row.origin,
        destination: row.destination,
        customerId: row.customerId,
        mode: row.mode,
        carrier: row.carrier,
        label: row.label,
        currencyCode: row.currencyCode,
        amount: row.amount,
        validFrom: row.validFrom,
        validTo: row.validTo,
        source: row.source,
        isActive: row.isActive ?? true,
      })
      .returning()

    if (!created) {
      throw new Error("Failed to insert rate")
    }

    return created
  }

  async getById(organizationId: string, id: string): Promise<RateRow | null> {
    const [row] = await this.db
      .select()
      .from(rateCatalog)
      .where(
        and(
          eq(rateCatalog.organizationId, organizationId),
          eq(rateCatalog.id, id)
        )
      )
      .limit(1)

    return row ?? null
  }

  async update(
    organizationId: string,
    id: string,
    patch: RateUpdate
  ): Promise<RateRow | null> {
    const [updated] = await this.db
      .update(rateCatalog)
      .set(patch)
      .where(
        and(
          eq(rateCatalog.organizationId, organizationId),
          eq(rateCatalog.id, id)
        )
      )
      .returning()

    return updated ?? null
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(rateCatalog)
      .where(
        and(
          eq(rateCatalog.organizationId, organizationId),
          eq(rateCatalog.id, id)
        )
      )
      .returning({ id: rateCatalog.id })

    return deleted.length > 0
  }
}
