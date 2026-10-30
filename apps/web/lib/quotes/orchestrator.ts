import "server-only"

import type {
  QuoteFormValues,
  QuoteListItemView,
  QuoteSource,
} from "@starboard/contracts"

import { getGeographyClient } from "@/lib/clients/geography-client"
import { getQuotesClient } from "@/lib/clients/quotes-client"
import {
  getCustomerNamesByIds,
  listCustomerOptions,
} from "@/lib/crm/orchestrator"
import { getUserNamesByIds } from "@/lib/organizations/queries"

export async function listQuotesForOrg(
  organizationId: string
): Promise<QuoteListItemView[]> {
  const quotes = await getQuotesClient().listQuotes(organizationId)
  const ownerIds = quotes.map((q) => q.ownerId)
  const customerIds = quotes
    .map((q) => q.customerId)
    .filter((id): id is string => Boolean(id))

  const [owners, customers] = await Promise.all([
    getUserNamesByIds(ownerIds),
    getCustomerNamesByIds(organizationId, customerIds),
  ])

  return quotes.map((quote) => ({
    ...quote,
    ownerName: owners.get(quote.ownerId) ?? "Unknown",
    customerName: quote.customerId
      ? (customers.get(quote.customerId) ?? null)
      : null,
  }))
}

export async function getQuoteFormValuesForOrg(
  quoteId: string,
  organizationId: string
) {
  return getQuotesClient().getQuoteFormValues(quoteId, organizationId)
}

export async function createQuoteForSession(input: {
  ownerId: string
  organizationId: string
  customerId?: string | null
  source?: QuoteSource
  currencyCode?: string | null
}) {
  const requestId = crypto.randomUUID()
  const currencyCode = input.currencyCode?.trim().toUpperCase() || null

  if (currencyCode) {
    await getGeographyClient().ensureCurrency(currencyCode, requestId)
  }

  return getQuotesClient().createQuote(
    {
      ownerId: input.ownerId,
      organizationId: input.organizationId,
      customerId: input.customerId,
      source: input.source,
      currencyCode,
    },
    requestId
  )
}

export async function saveQuoteForSession(
  values: QuoteFormValues,
  input: { ownerId: string; organizationId: string }
) {
  const requestId = crypto.randomUUID()
  const currencyCode = values.currencyCode.trim().toUpperCase()

  if (currencyCode) {
    await getGeographyClient().ensureCurrency(currencyCode, requestId)
  }

  return getQuotesClient().saveQuote(values, input, requestId)
}

export async function loadQuoteFormOptions(organizationId: string) {
  const requestId = crypto.randomUUID()
  const [
    customerOptions,
    currencyOptions,
    portOptions,
    containerTypeOptions,
    palletTypeOptions,
  ] = await Promise.all([
    listCustomerOptions(organizationId, requestId),
    getGeographyClient().listCurrencyOptions(requestId),
    getGeographyClient().searchPorts("", requestId),
    getQuotesClient().listContainerTypeOptions(requestId),
    getQuotesClient().listPalletTypeOptions(requestId),
  ])

  return {
    customerOptions,
    currencyOptions,
    portOptions,
    containerTypeOptions,
    palletTypeOptions,
  }
}
