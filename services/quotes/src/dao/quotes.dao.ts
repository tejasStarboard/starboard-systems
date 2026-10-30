import { and, asc, desc, eq } from "drizzle-orm"
import {
  emptyLaneFormValues,
  toDateInputValue,
  type FormOption,
  type QuoteFormValues,
  type QuoteListItem,
  type QuoteSource,
  type QuoteStatus,
} from "@starboard/contracts"
import { containerType, palletType, quote } from "@starboard/db/schema"

import type { QuotesDb } from "./db"

export type QuoteInsert = {
  id: string
  source: QuoteSource
  status: QuoteStatus
  ownerId: string
  organizationId: string
  quoteId: string
  customerId: string | null
  effectiveFrom: Date | null
  expiryAt: Date | null
  currencyCode: string | null
}

export type QuoteUpdate = {
  status: QuoteStatus
  customerId: string | null
  effectiveFrom: Date | null
  expiryAt: Date | null
  currencyCode: string | null
}

export interface QuotesDao {
  listByOrganization(organizationId: string): Promise<QuoteListItem[]>
  findFormValues(
    quoteId: string,
    organizationId: string
  ): Promise<QuoteFormValues | null>
  findShortQuoteId(
    organizationId: string,
    shortId: string
  ): Promise<{ id: string } | null>
  insert(row: QuoteInsert): Promise<void>
  update(
    id: string,
    organizationId: string,
    payload: QuoteUpdate
  ): Promise<boolean>
  existsInOrganization(id: string, organizationId: string): Promise<boolean>
  listContainerTypes(): Promise<FormOption[]>
  listPalletTypes(): Promise<FormOption[]>
}

export class DrizzleQuotesDao implements QuotesDao {
  constructor(private readonly db: QuotesDb) {}

  async listByOrganization(organizationId: string): Promise<QuoteListItem[]> {
    const rows = await this.db
      .select({
        id: quote.id,
        quoteId: quote.quoteId,
        source: quote.source,
        status: quote.status,
        customerId: quote.customerId,
        currencyCode: quote.currencyCode,
        ownerId: quote.ownerId,
        organizationId: quote.organizationId,
        effectiveFrom: quote.effectiveFrom,
        expiryAt: quote.expiryAt,
        createdAt: quote.createdAt,
      })
      .from(quote)
      .where(eq(quote.organizationId, organizationId))
      .orderBy(desc(quote.createdAt))

    return rows.map((row) => ({
      id: row.id,
      quoteId: row.quoteId,
      source: row.source,
      status: row.status,
      customerId: row.customerId,
      currencyCode: row.currencyCode,
      ownerId: row.ownerId,
      organizationId: row.organizationId,
      effectiveFrom: row.effectiveFrom?.toISOString() ?? null,
      expiryAt: row.expiryAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }))
  }

  async findFormValues(
    quoteId: string,
    organizationId: string
  ): Promise<QuoteFormValues | null> {
    const [row] = await this.db
      .select({
        id: quote.id,
        quoteId: quote.quoteId,
        source: quote.source,
        status: quote.status,
        customerId: quote.customerId,
        currencyCode: quote.currencyCode,
        effectiveFrom: quote.effectiveFrom,
        expiryAt: quote.expiryAt,
      })
      .from(quote)
      .where(
        and(eq(quote.id, quoteId), eq(quote.organizationId, organizationId))
      )
      .limit(1)

    if (!row) {
      return null
    }

    return {
      id: row.id,
      quoteId: row.quoteId,
      source: row.source,
      status: row.status,
      customerId: row.customerId ?? "",
      currencyCode: row.currencyCode ?? "",
      effectiveFrom: toDateInputValue(row.effectiveFrom),
      expiryAt: toDateInputValue(row.expiryAt),
      lane: emptyLaneFormValues(),
      manualRates: [],
      markupType: "amount",
      markupValue: 0,
    }
  }

  async findShortQuoteId(organizationId: string, shortId: string) {
    const [existing] = await this.db
      .select({ id: quote.id })
      .from(quote)
      .where(
        and(
          eq(quote.organizationId, organizationId),
          eq(quote.quoteId, shortId)
        )
      )
      .limit(1)

    return existing ?? null
  }

  async insert(row: QuoteInsert): Promise<void> {
    await this.db.insert(quote).values(row)
  }

  async update(
    id: string,
    organizationId: string,
    payload: QuoteUpdate
  ): Promise<boolean> {
    const result = await this.db
      .update(quote)
      .set(payload)
      .where(and(eq(quote.id, id), eq(quote.organizationId, organizationId)))
      .returning({ id: quote.id })

    return result.length > 0
  }

  async existsInOrganization(
    id: string,
    organizationId: string
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: quote.id })
      .from(quote)
      .where(and(eq(quote.id, id), eq(quote.organizationId, organizationId)))
      .limit(1)

    return Boolean(row)
  }

  async listContainerTypes(): Promise<FormOption[]> {
    const rows = await this.db
      .select({
        type: containerType.type,
        label: containerType.label,
      })
      .from(containerType)
      .orderBy(asc(containerType.type))

    return rows.map((row) => ({
      value: row.type,
      label: row.label,
    }))
  }

  async listPalletTypes(): Promise<FormOption[]> {
    const rows = await this.db
      .select({
        type: palletType.type,
        label: palletType.label,
      })
      .from(palletType)
      .orderBy(asc(palletType.label))

    return rows.map((row) => ({
      value: row.type,
      label: row.label,
    }))
  }
}
