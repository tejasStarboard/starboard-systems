import { describe, expect, test } from "bun:test"
import {
  createContainerLine,
  createManualRateLine,
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
} from "./lane-mapper"
import { DefaultQuotesService } from "./quotes.service"
import type {
  QuoteInsert,
  QuoteUpdate,
  QuotesDao,
  ReplaceLanesInput,
} from "../dao/quotes.dao"

class InMemoryQuotesDao implements QuotesDao {
  private quotes = new Map<string, QuoteInsert & { organizationId: string }>()
  private lanesByQuote = new Map<string, LaneRow[]>()
  private ratesByLane = new Map<string, RateRow[]>()

  async listByOrganization(organizationId: string): Promise<QuoteListItem[]> {
    return [...this.quotes.values()]
      .filter((row) => row.organizationId === organizationId)
      .map((row) => ({
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
            rowsToLaneForm(laneRow, this.ratesByLane.get(laneRow.id) ?? [])
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
      createManualRateLine({ id: "rate-1", label: "Base", amount: 900 }),
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
        { id: "rate-1", label: "Base", amount: 900 },
        { id: "rate-2", label: "THC", amount: 150 },
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
})

function toDateInput(value: Date | null) {
  if (!value) {
    return ""
  }
  return value.toISOString().slice(0, 10)
}
