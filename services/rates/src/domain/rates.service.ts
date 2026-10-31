import {
  createRateRequestSchema,
  listRatesQuerySchema,
  rateSchema,
  type CreateRateRequest,
  type CreateRateResponse,
  type GetRateResponse,
  type ListRatesQuery,
  type Rate,
} from "@starboard/lib-contracts"

import type { ListRatesFilters, RatesDao, RateRow } from "../dao/rates.dao"

export interface RatesService {
  list(organizationId: string, query: ListRatesQuery): Promise<Rate[]>
  create(
    organizationId: string,
    input: CreateRateRequest
  ): Promise<CreateRateResponse>
  get(organizationId: string, id: string): Promise<GetRateResponse>
}

export class DefaultRatesService implements RatesService {
  constructor(private readonly dao: RatesDao) {}

  async list(organizationId: string, query: ListRatesQuery): Promise<Rate[]> {
    const orgId = requireOrgId(organizationId)
    const parsed = listRatesQuerySchema.safeParse(query)
    if (!parsed.success) {
      throw new RatesValidationError(
        parsed.error.issues[0]?.message ?? "Invalid list query"
      )
    }

    const filters: ListRatesFilters = {
      q: parsed.data.q,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      customerId: parsed.data.customerId,
      validAt: parseOptionalDate(parsed.data.validAt, "validAt"),
    }

    const rows = await this.dao.listByOrganization(orgId, filters)
    return rows.map(toRateDto)
  }

  async create(
    organizationId: string,
    input: CreateRateRequest
  ): Promise<CreateRateResponse> {
    const orgId = requireOrgId(organizationId)
    const parsed = createRateRequestSchema.safeParse(input)
    if (!parsed.success) {
      throw new RatesValidationError(
        parsed.error.issues[0]?.message ?? "Invalid rate"
      )
    }

    const validFrom = parseRequiredDate(parsed.data.validFrom, "validFrom")
    const validTo = parseRequiredDate(parsed.data.validTo, "validTo")
    if (validTo.getTime() < validFrom.getTime()) {
      throw new RatesValidationError("validTo must be on or after validFrom")
    }

    const created = await this.dao.insert({
      id: crypto.randomUUID(),
      organizationId: orgId,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      customerId: parsed.data.customerId,
      mode: parsed.data.mode,
      carrier: parsed.data.carrier,
      label: parsed.data.label,
      currencyCode: parsed.data.currencyCode.toUpperCase(),
      amount: parsed.data.amount,
      validFrom,
      validTo,
      source: parsed.data.source,
    })

    return toRateDto(created)
  }

  async get(organizationId: string, id: string): Promise<GetRateResponse> {
    const orgId = requireOrgId(organizationId)
    const rateId = id.trim()
    if (!rateId) {
      throw new RatesValidationError("Rate id is required")
    }

    const row = await this.dao.getById(orgId, rateId)
    if (!row) {
      throw new RatesNotFoundError("Rate not found")
    }

    return toRateDto(row)
  }
}

export class RatesValidationError extends Error {
  readonly status = 400 as const
}

export class RatesNotFoundError extends Error {
  readonly status = 404 as const
}

function requireOrgId(organizationId: string): string {
  const orgId = organizationId.trim()
  if (!orgId) {
    throw new RatesValidationError("organizationId is required")
  }
  return orgId
}

function parseRequiredDate(value: string, field: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new RatesValidationError(`${field} must be a valid ISO datetime`)
  }
  return date
}

function parseOptionalDate(value: string, field: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  return parseRequiredDate(trimmed, field)
}

function toRateDto(row: RateRow): Rate {
  const dto = {
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
    validFrom: row.validFrom.toISOString(),
    validTo: row.validTo.toISOString(),
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    surcharges: [] as Rate["surcharges"],
  }
  const parsed = rateSchema.safeParse(dto)
  if (!parsed.success) {
    throw new Error("Failed to map rate row")
  }
  return parsed.data
}
