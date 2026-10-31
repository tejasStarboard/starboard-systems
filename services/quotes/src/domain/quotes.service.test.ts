import { describe, expect, test } from "bun:test"
import {
  createContainerLine,
  createManualRateLine,
  createSurchargeLine,
  emptyLaneFormValues,
  emptyQuoteFormValues,
  type FormOption,
  type LaneFormValues,
  type QuoteFormValues,
  type QuoteListItem,
} from "@starboard/lib-contracts"

import {
  laneFormToRows,
  resolveRateValidity,
  rowsToLaneForm,
  type LaneRow,
  type RateRow,
  type SurchargeRow,
} from "./lane-mapper"
import { DefaultQuotesService } from "./quotes.service"
import type {
  QuoteInsert,
  QuoteUpdate,
  QuotesDao,
  QuotesListParams,
  QuotesListResult,
  ReplaceLanesInput,
} from "../dao/quotes.dao"

class InMemoryQuotesDao implements QuotesDao {
  private quotes = new Map<string, QuoteInsert & { organizationId: string }>()
  private lanesByQuote = new Map<string, LaneRow[]>()
  private ratesByLane = new Map<string, RateRow[]>()
  private surchargesByRateId = new Map<string, SurchargeRow[]>()

  async listByOrganization(
    organizationId: string,
    params: QuotesListParams
  ): Promise<QuotesListResult> {
    const q = params.q?.trim().toLowerCase() ?? ""
    const filtered = [...this.quotes.values()]
      .filter((row) => row.organizationId === organizationId)
      .filter((row) => {
        if (!q) return true
        return (
          row.quoteId.toLowerCase().includes(q) ||
          row.status.toLowerCase().includes(q) ||
          (row.currencyCode ?? "").toLowerCase().includes(q) ||
          row.source.toLowerCase().includes(q)
        )
      })
      .map((row): QuoteListItem => ({
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
        createdAt: new Date().toISOString(),
      }))

    return {
      rows: filtered.slice(params.offset, params.offset + params.limit),
      total: filtered.length,
    }
  }

  async findFormValues(
    quoteId: string,
    organizationId: string
  ): Promise<QuoteFormValues | null> {
    const row = this.quotes.get(quoteId)
    if (!row || row.organizationId !== organizationId) {
      return null
    }

    const laneRows = this.lanesByQuote.get(quoteId) ?? []
    const lanes: LaneFormValues[] =
      laneRows.length === 0
        ? [emptyLaneFormValues()]
        : laneRows.map((laneRow) =>
            rowsToLaneForm(
              laneRow,
              this.ratesByLane.get(laneRow.id) ?? [],
              this.surchargesByRateId
            )
          )

    return {
      id: row.id,
      quoteId: row.quoteId,
      source: row.source,
      status: row.status,
      customerId: row.customerId ?? "",
      currencyCode: row.currencyCode ?? "",
      effectiveFrom: toDateInput(row.effectiveFrom),
      expiryAt: toDateInput(row.expiryAt),
      lanes,
    }
  }

  async findShortQuoteId(organizationId: string, shortId: string) {
    for (const row of this.quotes.values()) {
      if (row.organizationId === organizationId && row.quoteId === shortId) {
        return { id: row.id }
      }
    }
    return null
  }

  async insert(row: QuoteInsert): Promise<void> {
    this.quotes.set(row.id, row)
  }

  async update(
    id: string,
    organizationId: string,
    payload: QuoteUpdate
  ): Promise<boolean> {
    const existing = this.quotes.get(id)
    if (!existing || existing.organizationId !== organizationId) {
      return false
    }
    this.quotes.set(id, { ...existing, ...payload })
    return true
  }

  async existsInOrganization(
    id: string,
    organizationId: string
  ): Promise<boolean> {
    const row = this.quotes.get(id)
    return Boolean(row && row.organizationId === organizationId)
  }

  async replaceLanes(input: ReplaceLanesInput): Promise<boolean> {
    if (
      !(await this.existsInOrganization(input.quoteId, input.organizationId))
    ) {
      return false
    }

    const previous = this.lanesByQuote.get(input.quoteId) ?? []
    for (const previousLane of previous) {
      const previousRates = this.ratesByLane.get(previousLane.id) ?? []
      for (const previousRate of previousRates) {
        this.surchargesByRateId.delete(previousRate.id)
      }
      this.ratesByLane.delete(previousLane.id)
    }

    const validity = resolveRateValidity({
      effectiveFrom: input.effectiveFrom,
      expiryAt: input.expiryAt,
    })
    const nextLanes: LaneRow[] = []
    for (const formLane of input.lanes) {
      const mapped = laneFormToRows(
        formLane,
        input.quoteId,
        input.currencyCode ?? "",
        validity
      )
      nextLanes.push(mapped.lane)
      this.ratesByLane.set(mapped.lane.id, mapped.rates)
      for (const surchargeRow of mapped.surcharges) {
        const list = this.surchargesByRateId.get(surchargeRow.rateId) ?? []
        list.push(surchargeRow)
        this.surchargesByRateId.set(surchargeRow.rateId, list)
      }
    }
    this.lanesByQuote.set(input.quoteId, nextLanes)
    return true
  }

  async listContainerTypes(): Promise<FormOption[]> {
    return []
  }

  async listPalletTypes(): Promise<FormOption[]> {
    return []
  }
}

describe("DefaultQuotesService.save", () => {
  test("persists lanes, cargo, and rates for reload", async () => {
    const dao = new InMemoryQuotesDao()
    const service = new DefaultQuotesService(dao)
    const quoteId = "quote-uuid-1"

    const lane = emptyLaneFormValues("fcl")
    lane.id = "lane-1"
    lane.origin = "CNSHA"
    lane.destination = "USLAX"
    lane.pickup = {
      street: "Warehouse A",
      city: "Mississauga",
      state: "ON",
      zip: "",
      country: "Canada",
      countryCode: "CA",
      lat: null,
      lng: null,
      label: "Warehouse A, Mississauga, ON, Canada",
    }
    lane.delivery = {
      street: "Warehouse B",
      city: "Brambleton",
      state: "VA",
      zip: "",
      country: "United States",
      countryCode: "US",
      lat: null,
      lng: null,
      label: "Warehouse B, Brambleton, VA, USA",
    }
    lane.containers = [
      createContainerLine({
        id: "ctr-1",
        containerType: "20GP",
        weight: 8000,
        count: 1,
      }),
    ]
    lane.manualRates = [
      createManualRateLine({
        id: "rate-1",
        label: "Base",
        amount: 900,
        surcharges: [
          createSurchargeLine({
            id: "sch-1",
            name: "BAF",
            leg: "freight",
            usageUnit: "container",
            rate: 50,
            currencyCode: "USD",
            source: "carrier",
            freeUsage: 0,
            minUsage: 1,
            maxUsage: 10,
            buyAmount: 40,
            sellAmount: 50,
          }),
        ],
      }),
      createManualRateLine({ id: "rate-2", label: "THC", amount: 150 }),
    ]
    lane.markupType = "amount"
    lane.markupValue = 50

    const values = emptyQuoteFormValues({ id: quoteId, quoteId: "Q1A2B3" })
    values.currencyCode = "USD"
    values.effectiveFrom = "2026-03-01"
    values.expiryAt = "2026-06-01"
    values.lanes = [lane]

    await service.save(values, {
      ownerId: "user-1",
      organizationId: "org-1",
    })

    const loaded = await service.get(quoteId, "org-1")
    expect(loaded.currencyCode).toBe("USD")
    expect(loaded.lanes).toHaveLength(1)
    expect(loaded.lanes[0]).toMatchObject({
      id: "lane-1",
      origin: "CNSHA",
      destination: "USLAX",
      pickup: expect.objectContaining({ city: "Mississauga" }),
      delivery: expect.objectContaining({ city: "Brambleton" }),
      markupType: "amount",
      markupValue: 50,
      containers: [
        {
          id: "ctr-1",
          containerType: "20GP",
          weight: 8000,
          count: 1,
        },
      ],
      manualRates: [
        {
          id: "rate-1",
          label: "Base",
          amount: 900,
          surcharges: [
            {
              id: "sch-1",
              name: "BAF",
              leg: "freight",
              usageUnit: "container",
              rate: 50,
              buyAmount: 40,
              sellAmount: 50,
              freeUsage: 0,
              minUsage: 1,
              maxUsage: 10,
              isIncludedInTotal: true,
              isRemoved: false,
              isVisible: true,
            },
          ],
        },
        { id: "rate-2", label: "THC", amount: 150, surcharges: [] },
      ],
    })
  })

  test("rejects get for another organization", async () => {
    const dao = new InMemoryQuotesDao()
    const service = new DefaultQuotesService(dao)
    const values = emptyQuoteFormValues({ id: "quote-2", quoteId: "ZZZZZZ" })
    values.lanes = [emptyLaneFormValues("fcl")]

    await service.save(values, {
      ownerId: "user-1",
      organizationId: "org-1",
    })

    await expect(service.get("quote-2", "org-other")).rejects.toMatchObject({
      status: 404,
    })
  })

  test("paginates quote lists", async () => {
    const dao = new InMemoryQuotesDao()
    const service = new DefaultQuotesService(dao)

    for (const id of ["quote-a", "quote-b", "quote-c"]) {
      const values = emptyQuoteFormValues({
        id,
        quoteId: id.slice(-6).toUpperCase(),
      })
      values.lanes = [emptyLaneFormValues("fcl")]
      await service.save(values, {
        ownerId: "user-1",
        organizationId: "org-1",
      })
    }

    const page1 = await service.list("org-1", { page: 1, pageSize: 2 })
    expect(page1.quotes).toHaveLength(2)
    expect(page1.total).toBe(3)
    expect(page1.page).toBe(1)
    expect(page1.pageSize).toBe(2)

    const page2 = await service.list("org-1", { page: 2, pageSize: 2 })
    expect(page2.quotes).toHaveLength(1)
    expect(page2.total).toBe(3)
  })
})

function toDateInput(value: Date | null) {
  if (!value) {
    return ""
  }
  return value.toISOString().slice(0, 10)
}
