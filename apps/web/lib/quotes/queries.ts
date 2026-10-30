import { asc, desc, eq } from "drizzle-orm"
import {
  containerType,
  currency,
  organization,
  palletType,
  quote,
  user,
} from "@starboard/db/schema"

import { db } from "@/lib/db"
import {
  emptyLaneFormValues,
  toDateInputValue,
  type QuoteFormOption,
  type QuoteFormValues,
  type QuoteListItem,
} from "@/lib/quotes/schema"

export async function listQuotes(
  organizationId?: string | null
): Promise<QuoteListItem[]> {
  const rows = await db
    .select({
      id: quote.id,
      quoteId: quote.quoteId,
      source: quote.source,
      status: quote.status,
      customerId: quote.customerId,
      customerName: organization.name,
      currencyCode: quote.currencyCode,
      ownerName: user.name,
      effectiveFrom: quote.effectiveFrom,
      expiryAt: quote.expiryAt,
      createdAt: quote.createdAt,
    })
    .from(quote)
    .leftJoin(organization, eq(quote.customerId, organization.id))
    .innerJoin(user, eq(quote.ownerId, user.id))
    .where(
      organizationId ? eq(quote.organizationId, organizationId) : undefined
    )
    .orderBy(desc(quote.createdAt))

  return rows.map((row) => ({
    id: row.id,
    quoteId: row.quoteId,
    source: row.source,
    status: row.status,
    customerId: row.customerId,
    customerName: row.customerName,
    currencyCode: row.currencyCode,
    ownerName: row.ownerName,
    effectiveFrom: row.effectiveFrom?.toISOString() ?? null,
    expiryAt: row.expiryAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function getQuoteFormValues(
  quoteId: string
): Promise<QuoteFormValues | null> {
  const [row] = await db
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
    .where(eq(quote.id, quoteId))
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

export async function listCurrencyOptions(): Promise<QuoteFormOption[]> {
  const rows = await db
    .select({ code: currency.code })
    .from(currency)
    .orderBy(asc(currency.code))

  return rows.map((row) => ({
    value: row.code,
    label: row.code,
  }))
}

export async function listCustomerOptions(): Promise<QuoteFormOption[]> {
  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
    })
    .from(organization)
    .orderBy(asc(organization.name))

  return rows.map((row) => ({
    value: row.id,
    label: row.name,
  }))
}

export async function listContainerTypeOptions(): Promise<QuoteFormOption[]> {
  const rows = await db
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

export async function listPalletTypeOptions(): Promise<QuoteFormOption[]> {
  const rows = await db
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
