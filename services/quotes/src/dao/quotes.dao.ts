import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm"
import {
  emptyLaneFormValues,
  toDateInputValue,
  type FormOption,
  type LaneFormValues,
  type QuoteFormValues,
  type QuoteListItem,
  type QuoteSource,
  type QuoteStatus,
  type SurchargeLine,
} from "@starboard/lib-contracts"
import {
  containerType,
  globalCharge,
  lane,
  palletType,
  quote,
  rate,
  surcharge,
} from "@starboard/lib-db/schema"

import {
  globalChargeLineToRow,
  globalChargeRowToLine,
  laneFormToRows,
  resolveRateValidity,
  rowsToLaneForm,
  type LaneRow,
  type RateRow,
  type SurchargeRow,
} from "../domain/lane-mapper"
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

export type ReplaceLanesInput = {
  quoteId: string
  organizationId: string
  lanes: LaneFormValues[]
  globalCharges: SurchargeLine[]
  currencyCode: string | null
  effectiveFrom: Date | null
  expiryAt: Date | null
}

export type QuotesListParams = {
  limit: number
  offset: number
  q?: string
}

export type QuotesListResult = {
  rows: QuoteListItem[]
  total: number
}

export interface QuotesDao {
  listByOrganization(
    organizationId: string,
    params: QuotesListParams
  ): Promise<QuotesListResult>
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
  replaceLanes(input: ReplaceLanesInput): Promise<boolean>
  listContainerTypes(): Promise<FormOption[]>
  listPalletTypes(): Promise<FormOption[]>
}

export class DrizzleQuotesDao implements QuotesDao {
  constructor(private readonly db: QuotesDb) {}

  async listByOrganization(
    organizationId: string,
    params: QuotesListParams
  ): Promise<QuotesListResult> {
    const whereClause = this.listWhere(organizationId, params.q)

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(quote)
      .where(whereClause)

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
      .where(whereClause)
      .orderBy(desc(quote.createdAt))
      .limit(params.limit)
      .offset(params.offset)

    return {
      rows: rows.map((row) => ({
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
      })),
      total: totalRow?.total ?? 0,
    }
  }

  private listWhere(organizationId: string, q?: string): SQL {
    const conditions: SQL[] = [eq(quote.organizationId, organizationId)]
    const trimmed = q?.trim()
    if (!trimmed) {
      return and(...conditions)!
    }

    const pattern = `%${trimmed}%`
    conditions.push(
      or(
        ilike(quote.quoteId, pattern),
        ilike(quote.status, pattern),
        ilike(quote.currencyCode, pattern),
        ilike(quote.source, pattern)
      )!
    )
    return and(...conditions)!
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

    const laneRows = await this.db
      .select({
        id: lane.id,
        mode: lane.mode,
        pickupAddress: lane.pickupAddress,
        origin: lane.origin,
        originVia: lane.originVia,
        destinationVia: lane.destinationVia,
        destination: lane.destination,
        deliveryAddress: lane.deliveryAddress,
        quoteId: lane.quoteId,
        cargo: lane.cargo,
        markupType: lane.markupType,
        markupValue: lane.markupValue,
      })
      .from(lane)
      .where(eq(lane.quoteId, quoteId))
      .orderBy(asc(lane.createdAt))

    const laneIds = laneRows.map((entry) => entry.id)
    const rateRows =
      laneIds.length === 0
        ? []
        : await this.db
            .select({
              id: rate.id,
              laneId: rate.laneId,
              currencyCode: rate.currencyCode,
              label: rate.label,
              rate: rate.rate,
              validFrom: rate.validFrom,
              validTo: rate.validTo,
            })
            .from(rate)
            .where(inArray(rate.laneId, laneIds))
            .orderBy(asc(rate.createdAt))

    const rateIds = rateRows.map((entry) => entry.id)
    const surchargeRows =
      rateIds.length === 0
        ? []
        : await this.db
            .select({
              id: surcharge.id,
              rateId: surcharge.rateId,
              name: surcharge.name,
              leg: surcharge.leg,
              usageUnit: surcharge.usageUnit,
              rate: surcharge.rate,
              ratePercentage: surcharge.ratePercentage,
              currencyCode: surcharge.currencyCode,
              source: surcharge.source,
              isIncludedInTotal: surcharge.isIncludedInTotal,
              isRemoved: surcharge.isRemoved,
              isVisible: surcharge.isVisible,
              freeUsage: surcharge.freeUsage,
              minUsage: surcharge.minUsage,
              maxUsage: surcharge.maxUsage,
              buyAmount: surcharge.buyAmount,
              sellAmount: surcharge.sellAmount,
              scopeOverride: surcharge.scopeOverride,
            })
            .from(surcharge)
            .where(inArray(surcharge.rateId, rateIds))
            .orderBy(asc(surcharge.createdAt))

    const ratesByLane = new Map<string, RateRow[]>()
    for (const rateRow of rateRows) {
      const list = ratesByLane.get(rateRow.laneId) ?? []
      list.push(rateRow)
      ratesByLane.set(rateRow.laneId, list)
    }

    const surchargesByRateId = new Map<string, SurchargeRow[]>()
    for (const surchargeRow of surchargeRows) {
      const list = surchargesByRateId.get(surchargeRow.rateId) ?? []
      list.push(surchargeRow as SurchargeRow)
      surchargesByRateId.set(surchargeRow.rateId, list)
    }

    const globalChargeRows = await this.db
      .select({
        id: globalCharge.id,
        quoteId: globalCharge.quoteId,
        name: globalCharge.name,
        leg: globalCharge.leg,
        usageUnit: globalCharge.usageUnit,
        rate: globalCharge.rate,
        ratePercentage: globalCharge.ratePercentage,
        currencyCode: globalCharge.currencyCode,
        source: globalCharge.source,
        isIncludedInTotal: globalCharge.isIncludedInTotal,
        isRemoved: globalCharge.isRemoved,
        isVisible: globalCharge.isVisible,
        freeUsage: globalCharge.freeUsage,
        minUsage: globalCharge.minUsage,
        maxUsage: globalCharge.maxUsage,
        buyAmount: globalCharge.buyAmount,
        sellAmount: globalCharge.sellAmount,
        scopeOverride: globalCharge.scopeOverride,
      })
      .from(globalCharge)
      .where(eq(globalCharge.quoteId, quoteId))
      .orderBy(asc(globalCharge.createdAt))

    const lanes =
      laneRows.length === 0
        ? [emptyLaneFormValues()]
        : laneRows.map((laneRow) =>
            rowsToLaneForm(
              laneRow as LaneRow,
              ratesByLane.get(laneRow.id) ?? [],
              surchargesByRateId
            )
          )

    return {
      id: row.id,
      quoteId: row.quoteId,
      source: row.source,
      status: row.status,
      customerId: row.customerId ?? "",
      currencyCode: row.currencyCode ?? "",
      effectiveFrom: toDateInputValue(row.effectiveFrom),
      expiryAt: toDateInputValue(row.expiryAt),
      globalCharges: globalChargeRows.map(globalChargeRowToLine),
      lanes,
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

  async replaceLanes(input: ReplaceLanesInput): Promise<boolean> {
    const inOrg = await this.existsInOrganization(
      input.quoteId,
      input.organizationId
    )
    if (!inOrg) {
      return false
    }

    await this.db.delete(lane).where(eq(lane.quoteId, input.quoteId))
    await this.db
      .delete(globalCharge)
      .where(eq(globalCharge.quoteId, input.quoteId))

    const validity = resolveRateValidity({
      effectiveFrom: input.effectiveFrom,
      expiryAt: input.expiryAt,
    })
    const currencyCode = input.currencyCode ?? ""

    const globalRows = input.globalCharges.map((line) =>
      globalChargeLineToRow(line, input.quoteId)
    )
    if (globalRows.length > 0) {
      await this.db.insert(globalCharge).values(
        globalRows.map((row) => ({
          id: row.id,
          quoteId: row.quoteId,
          name: row.name,
          leg: row.leg,
          usageUnit: row.usageUnit,
          rate: row.rate,
          ratePercentage: row.ratePercentage,
          currencyCode: row.currencyCode,
          source: row.source,
          isIncludedInTotal: row.isIncludedInTotal,
          isRemoved: row.isRemoved,
          isVisible: row.isVisible,
          freeUsage: row.freeUsage,
          minUsage: row.minUsage,
          maxUsage: row.maxUsage,
          buyAmount: row.buyAmount,
          sellAmount: row.sellAmount,
          scopeOverride: row.scopeOverride,
        }))
      )
    }

    for (const formLane of input.lanes) {
      const mapped = laneFormToRows(
        formLane,
        input.quoteId,
        currencyCode,
        validity
      )

      await this.db.insert(lane).values({
        id: mapped.lane.id,
        mode: mapped.lane.mode,
        pickupAddress: mapped.lane.pickupAddress,
        origin: mapped.lane.origin,
        originVia: mapped.lane.originVia,
        destinationVia: mapped.lane.destinationVia,
        destination: mapped.lane.destination,
        deliveryAddress: mapped.lane.deliveryAddress,
        quoteId: mapped.lane.quoteId,
        cargo: mapped.lane.cargo,
        markupType: mapped.lane.markupType,
        markupValue: mapped.lane.markupValue,
        legOrder: [],
      })

      if (mapped.rates.length > 0) {
        await this.db.insert(rate).values(
          mapped.rates.map((rateRow) => ({
            id: rateRow.id,
            laneId: rateRow.laneId,
            currencyCode: rateRow.currencyCode,
            label: rateRow.label,
            rate: rateRow.rate,
            validFrom: rateRow.validFrom,
            validTo: rateRow.validTo,
          }))
        )
      }

      if (mapped.surcharges.length > 0) {
        await this.db.insert(surcharge).values(
          mapped.surcharges.map((surchargeRow) => ({
            id: surchargeRow.id,
            rateId: surchargeRow.rateId,
            name: surchargeRow.name,
            leg: surchargeRow.leg,
            usageUnit: surchargeRow.usageUnit,
            rate: surchargeRow.rate,
            ratePercentage: surchargeRow.ratePercentage,
            currencyCode: surchargeRow.currencyCode,
            source: surchargeRow.source,
            isIncludedInTotal: surchargeRow.isIncludedInTotal,
            isRemoved: surchargeRow.isRemoved,
            isVisible: surchargeRow.isVisible,
            freeUsage: surchargeRow.freeUsage,
            minUsage: surchargeRow.minUsage,
            maxUsage: surchargeRow.maxUsage,
            buyAmount: surchargeRow.buyAmount,
            sellAmount: surchargeRow.sellAmount,
            scopeOverride: surchargeRow.scopeOverride,
          }))
        )
      }
    }

    return true
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
