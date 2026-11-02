import {
  createRateRequestSchema,
  listRatesQuerySchema,
  rateSchema,
  updateRateRequestSchema,
  type CreateRateRequest,
  type CreateRateResponse,
  type GetRateResponse,
  type ListRatesQuery,
  type Rate,
  type UpdateRateRequest,
  type UpdateRateResponse,
} from "@starboard/lib-contracts"

import type {
  ListRatesFilters,
  RateUpdate,
  RatesDao,
  RateRow,
} from "../dao/rates.dao"

export interface RatesService {
  list(organizationId: string, query: ListRatesQuery): Promise<Rate[]>
  create(
    organizationId: string,
    input: CreateRateRequest
  ): Promise<CreateRateResponse>
  get(organizationId: string, id: string): Promise<GetRateResponse>
  update(
    organizationId: string,
    id: string,
    input: UpdateRateRequest
  ): Promise<UpdateRateResponse>
  delete(organizationId: string, id: string): Promise<void>
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
      includeInactive: parsed.data.includeInactive === true,
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
      isActive: true,
    })

    return toRateDto(created)
  }

  async get(organizationId: string, id: string): Promise<GetRateResponse> {
    const orgId = requireOrgId(organizationId)
    const rateId = requireRateId(id)

    const row = await this.dao.getById(orgId, rateId)
    if (!row) {
      throw new RatesNotFoundError("Rate not found")
    }

    return toRateDto(row)
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateRateRequest
  ): Promise<UpdateRateResponse> {
    const orgId = requireOrgId(organizationId)
    const rateId = requireRateId(id)
    const parsed = updateRateRequestSchema.safeParse(input)
    if (!parsed.success) {
      throw new RatesValidationError(
        parsed.error.issues[0]?.message ?? "Invalid rate update"
      )
    }

    const existing = await this.dao.getById(orgId, rateId)
    if (!existing) {
      throw new RatesNotFoundError("Rate not found")
    }

    const patch: RateUpdate = {}
    const data = parsed.data

    if (data.origin !== undefined) patch.origin = data.origin
    if (data.destination !== undefined) patch.destination = data.destination
    if (data.customerId !== undefined) patch.customerId = data.customerId
    if (data.mode !== undefined) patch.mode = data.mode
    if (data.carrier !== undefined) patch.carrier = data.carrier
    if (data.label !== undefined) patch.label = data.label
    if (data.currencyCode !== undefined) {
      patch.currencyCode = data.currencyCode.toUpperCase()
    }
    if (data.amount !== undefined) patch.amount = data.amount
    if (data.isActive !== undefined) patch.isActive = data.isActive

    const nextValidFrom =
      data.validFrom !== undefined
        ? parseRequiredDate(data.validFrom, "validFrom")
        : existing.validFrom
    const nextValidTo =
      data.validTo !== undefined
        ? parseRequiredDate(data.validTo, "validTo")
        : existing.validTo
    if (nextValidTo.getTime() < nextValidFrom.getTime()) {
      throw new RatesValidationError("validTo must be on or after validFrom")
    }
    if (data.validFrom !== undefined) patch.validFrom = nextValidFrom
    if (data.validTo !== undefined) patch.validTo = nextValidTo

    if (Object.keys(patch).length === 0) {
      return toRateDto(existing)
    }

    const updated = await this.dao.update(orgId, rateId, patch)
    if (!updated) {
      throw new RatesNotFoundError("Rate not found")
    }
    return toRateDto(updated)
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const orgId = requireOrgId(organizationId)
    const rateId = requireRateId(id)
    const deleted = await this.dao.delete(orgId, rateId)
    if (!deleted) {
      throw new RatesNotFoundError("Rate not found")
    }
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

function requireRateId(id: string): string {
  const rateId = id.trim()
  if (!rateId) {
    throw new RatesValidationError("Rate id is required")
  }
  return rateId
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
    isActive: row.isActive,
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
