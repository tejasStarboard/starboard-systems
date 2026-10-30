import {
  createQuoteRequestSchema,
  quoteFormSchema,
  type CreateQuoteRequest,
  type FormOption,
  type QuoteFormValues,
  type QuoteListItem,
  type QuoteSource,
} from "@starboard/contracts"

import type { QuotesDao } from "../dao/quotes.dao"

const SHORT_QUOTE_ID_LENGTH = 6
const SHORT_QUOTE_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const SHORT_QUOTE_ID_MAX_ATTEMPTS = 32

export class QuotesValidationError extends Error {
  readonly status = 400 as const
}

export class QuotesNotFoundError extends Error {
  readonly status = 404 as const

  constructor(message = "Quote not found") {
    super(message)
  }
}

export interface QuotesService {
  list(organizationId: string): Promise<QuoteListItem[]>
  get(quoteId: string, organizationId: string): Promise<QuoteFormValues>
  create(input: CreateQuoteRequest): Promise<{ id: string }>
  save(
    values: QuoteFormValues,
    input: { ownerId: string; organizationId: string }
  ): Promise<{ id: string }>
  listContainerTypes(): Promise<FormOption[]>
  listPalletTypes(): Promise<FormOption[]>
}

export class DefaultQuotesService implements QuotesService {
  constructor(private readonly dao: QuotesDao) {}

  async list(organizationId: string): Promise<QuoteListItem[]> {
    if (!organizationId) {
      throw new QuotesValidationError("organizationId is required")
    }
    return this.dao.listByOrganization(organizationId)
  }

  async get(quoteId: string, organizationId: string): Promise<QuoteFormValues> {
    if (!organizationId) {
      throw new QuotesValidationError("organizationId is required")
    }

    const row = await this.dao.findFormValues(quoteId, organizationId)
    if (!row) {
      throw new QuotesNotFoundError()
    }
    return row
  }

  async create(input: CreateQuoteRequest): Promise<{ id: string }> {
    const parsed = createQuoteRequestSchema.safeParse(input)
    if (!parsed.success) {
      throw new QuotesValidationError(
        parsed.error.issues[0]?.message ?? "Invalid create quote request"
      )
    }

    const data = parsed.data
    const id = crypto.randomUUID()
    const currencyCode = data.currencyCode?.trim().toUpperCase() || null
    const quoteId = await this.createShortQuoteId(data.organizationId)

    await this.dao.insert({
      id,
      source: data.source ?? "manual",
      status: "draft",
      ownerId: data.ownerId,
      organizationId: data.organizationId,
      quoteId,
      customerId: data.customerId || null,
      effectiveFrom: null,
      expiryAt: null,
      currencyCode,
    })

    return { id }
  }

  async save(
    values: QuoteFormValues,
    input: { ownerId: string; organizationId: string }
  ): Promise<{ id: string }> {
    const parsed = quoteFormSchema.safeParse(values)
    if (!parsed.success) {
      throw new QuotesValidationError(
        parsed.error.issues[0]?.message ?? "Invalid quote"
      )
    }

    const data = parsed.data
    const currencyCode = data.currencyCode.trim().toUpperCase() || null
    const payload = {
      status: data.status,
      customerId: data.customerId.trim() || null,
      effectiveFrom: parseOptionalDate(data.effectiveFrom),
      expiryAt: parseOptionalDate(data.expiryAt),
      currencyCode,
    }

    const exists = await this.dao.existsInOrganization(
      data.id,
      input.organizationId
    )

    if (!exists) {
      await this.dao.insert({
        id: data.id,
        source: (data.source || "manual") as QuoteSource,
        ownerId: input.ownerId,
        organizationId: input.organizationId,
        quoteId:
          data.quoteId || (await this.createShortQuoteId(input.organizationId)),
        ...payload,
      })
    } else {
      const updated = await this.dao.update(
        data.id,
        input.organizationId,
        payload
      )
      if (!updated) {
        throw new QuotesNotFoundError()
      }
    }

    const lanesReplaced = await this.dao.replaceLanes({
      quoteId: data.id,
      organizationId: input.organizationId,
      lanes: data.lanes,
      currencyCode,
      effectiveFrom: payload.effectiveFrom,
      expiryAt: payload.expiryAt,
    })
    if (!lanesReplaced) {
      throw new QuotesNotFoundError()
    }

    return { id: data.id }
  }

  async listContainerTypes(): Promise<FormOption[]> {
    return this.dao.listContainerTypes()
  }

  async listPalletTypes(): Promise<FormOption[]> {
    return this.dao.listPalletTypes()
  }

  private async createShortQuoteId(organizationId: string) {
    for (let attempt = 0; attempt < SHORT_QUOTE_ID_MAX_ATTEMPTS; attempt++) {
      const candidate = generateAlphanumericQuoteId()
      const existing = await this.dao.findShortQuoteId(
        organizationId,
        candidate
      )
      if (!existing) {
        return candidate
      }
    }

    throw new Error(
      "Unable to generate a unique quote ID for this organization"
    )
  }
}

function generateAlphanumericQuoteId(length = SHORT_QUOTE_ID_LENGTH) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let result = ""

  for (const byte of bytes) {
    result += SHORT_QUOTE_ID_ALPHABET[byte % SHORT_QUOTE_ID_ALPHABET.length]
  }

  return result
}

function parseOptionalDate(value: string | undefined) {
  if (!value?.trim()) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
