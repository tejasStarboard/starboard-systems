import "server-only"

import type {
  FormOption,
  ListQuotesViewResponse,
  QuoteFormValues,
  QuotesListQueryInput,
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
import { orgDefaultBaseCurrency } from "@starboard/ext-org-settings/org-metadata"
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

  async listQuotesForOrg(
    organizationId: string,
    query?: QuotesListQueryInput
  ): Promise<ListQuotesViewResponse> {
    const result = await this.quotesClient.listQuotes(organizationId, query)
    const ownerIds = result.quotes.map((q) => q.ownerId)
    const customerIds = result.quotes
      .map((q) => q.customerId)
      .filter((id): id is string => Boolean(id))

    const [owners, customers] = await Promise.all([
      this.organizationsDao.getUserNamesByIds(ownerIds),
      this.crmManager.getCustomerNamesByIds(organizationId, customerIds),
    ])

    return {
      quotes: result.quotes.map((quote) => ({
        ...quote,
        ownerName: owners.get(quote.ownerId) ?? "Unknown",
        customerName: quote.customerId
          ? (customers.get(quote.customerId) ?? null)
          : null,
      })),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    }
  }

  /** Org Preferences → Quote default base currency (`null` when unset). */
  async getDefaultBaseCurrencyForOrg(
    organizationId: string
  ): Promise<string | null> {
    return orgDefaultBaseCurrency(
      await this.organizationsDao.getOrganizationMetadata(organizationId)
    )
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
    // Blank draft → org default base currency (Preferences → Quote).
    const currencyCode =
      input.currencyCode?.trim().toUpperCase() ||
      (await this.getDefaultBaseCurrencyForOrg(input.organizationId))

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

  async loadQuoteFormOptions(
    organizationId: string,
    saved?: { customerId?: string | null }
  ) {
    const requestId = crypto.randomUUID()
    const savedCustomerId = saved?.customerId?.trim() || null
    const [
      activeCustomerOptions,
      currencyOptions,
      containerTypeOptions,
      palletTypeOptions,
      savedCustomerNames,
    ] = await Promise.all([
      this.crmManager.listCustomerOptions(organizationId, requestId),
      this.geographyClient.listCurrencyOptions(requestId),
      this.quotesClient.listContainerTypeOptions(requestId),
      this.quotesClient.listPalletTypeOptions(requestId),
      savedCustomerId
        ? this.crmManager.getCustomerNamesByIds(
            organizationId,
            [savedCustomerId],
            requestId
          )
        : Promise.resolve(new Map<string, string>()),
    ])

    // The saved customer must stay selectable even if it is inactive / absent
    // from the active list (same pattern as currency and lane ports).
    const customerOptions = [...activeCustomerOptions]
    if (
      savedCustomerId &&
      !customerOptions.some((option) => option.value === savedCustomerId)
    ) {
      customerOptions.push({
        value: savedCustomerId,
        label: savedCustomerNames.get(savedCustomerId) ?? savedCustomerId,
      })
      customerOptions.sort((a, b) => a.label.localeCompare(b.label))
    }

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
