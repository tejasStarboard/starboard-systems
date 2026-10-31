import "server-only"

import type {
  FormOption,
  QuoteFormValues,
  QuoteListItemView,
  QuoteSource,
} from "@starboard/lib-contracts"

import {
  type GeographyClient,
  getGeographyClient,
} from "@/lib/domain/geography/geography.client"
import {
  getQuotesClient,
  type QuotesClient,
} from "@/lib/domain/quotes/quotes.client"
import { type CrmManager, getCrmManager } from "@/lib/domain/crm/crm.manager"
import {
  getOrganizationsDao,
  type OrganizationsDao,
} from "@/lib/domain/organizations/organizations.dao"

export class QuotesManager {
  constructor(
    private readonly quotesClient: QuotesClient = getQuotesClient(),
    private readonly crmManager: CrmManager = getCrmManager(),
    private readonly geographyClient: GeographyClient = getGeographyClient(),
    private readonly organizationsDao: OrganizationsDao = getOrganizationsDao()
  ) {}

  async listQuotesForOrg(organizationId: string): Promise<QuoteListItemView[]> {
    const quotes = await this.quotesClient.listQuotes(organizationId)
    const ownerIds = quotes.map((q) => q.ownerId)
    const customerIds = quotes
      .map((q) => q.customerId)
      .filter((id): id is string => Boolean(id))

    const [owners, customers] = await Promise.all([
      this.organizationsDao.getUserNamesByIds(ownerIds),
      this.crmManager.getCustomerNamesByIds(organizationId, customerIds),
    ])

    return quotes.map((quote) => ({
      ...quote,
      ownerName: owners.get(quote.ownerId) ?? "Unknown",
      customerName: quote.customerId
        ? (customers.get(quote.customerId) ?? null)
        : null,
    }))
  }

  async getQuoteFormValuesForOrg(quoteId: string, organizationId: string) {
    return this.quotesClient.getQuoteFormValues(quoteId, organizationId)
  }

  async createQuoteForSession(input: {
    ownerId: string
    organizationId: string
    customerId?: string | null
    source?: QuoteSource
    currencyCode?: string | null
  }) {
    const requestId = crypto.randomUUID()
    const currencyCode = input.currencyCode?.trim().toUpperCase() || null

    if (currencyCode) {
      await this.geographyClient.ensureCurrency(currencyCode, requestId)
    }

    return this.quotesClient.createQuote(
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

  async saveQuoteForSession(
    values: QuoteFormValues,
    input: { ownerId: string; organizationId: string }
  ) {
    const requestId = crypto.randomUUID()
    const currencyCode = values.currencyCode.trim().toUpperCase()

    if (currencyCode) {
      await this.geographyClient.ensureCurrency(currencyCode, requestId)
    }

    return this.quotesClient.saveQuote(values, input, requestId)
  }

  async loadQuoteFormOptions(organizationId: string) {
    const requestId = crypto.randomUUID()
    const [
      customerOptions,
      currencyOptions,
      containerTypeOptions,
      palletTypeOptions,
    ] = await Promise.all([
      this.crmManager.listCustomerOptions(organizationId, requestId),
      this.geographyClient.listCurrencyOptions(requestId),
      this.quotesClient.listContainerTypeOptions(requestId),
      this.quotesClient.listPalletTypeOptions(requestId),
    ])

    // Ports are not SSR-seeded: PortCombobox searches `/api/geography/ports`,
    // and the quote page adds labels for codes already on the lanes.
    return {
      customerOptions,
      currencyOptions,
      portOptions: [] as FormOption[],
      containerTypeOptions,
      palletTypeOptions,
    }
  }
}

let quotesManager: QuotesManager = new QuotesManager()

export function getQuotesManager(): QuotesManager {
  return quotesManager
}

export function setQuotesManager(manager: QuotesManager) {
  quotesManager = manager
}
