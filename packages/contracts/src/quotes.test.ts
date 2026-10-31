import { describe, expect, test } from "bun:test"

import {
  createCustomerRequestSchema,
  getCustomerNamesQuerySchema,
  listCustomersResponseSchema,
} from "./crm"
import {
  ensureCurrencyRequestSchema,
  facilityInputSchema,
  listPortsQuerySchema,
  listPortsResponseSchema,
} from "./geography"
import {
  createQuoteRequestSchema,
  emptyQuoteFormValues,
  quoteFormSchema,
  quoteListItemSchema,
} from "./quotes"

describe("quote contracts", () => {
  test("emptyQuoteFormValues produces a valid draft form", () => {
    const values = emptyQuoteFormValues({ id: "quote-1" })
    const parsed = quoteFormSchema.safeParse(values)
    expect(parsed.success).toBe(true)
  })

  test("createQuoteRequestSchema requires owner and organization", () => {
    expect(
      createQuoteRequestSchema.safeParse({
        ownerId: "user-1",
        organizationId: "org-1",
      }).success
    ).toBe(true)

    expect(
      createQuoteRequestSchema.safeParse({ ownerId: "user-1" }).success
    ).toBe(false)
  })

  test("quoteListItemSchema accepts service list rows", () => {
    const parsed = quoteListItemSchema.safeParse({
      id: "1",
      quoteId: "ABC123",
      source: "manual",
      status: "draft",
      customerId: null,
      currencyCode: "USD",
      ownerId: "user-1",
      organizationId: "org-1",
      effectiveFrom: null,
      expiryAt: null,
      createdAt: new Date().toISOString(),
    })
    expect(parsed.success).toBe(true)
  })
})

describe("geography contracts", () => {
  test("ensureCurrencyRequestSchema accepts ISO codes", () => {
    expect(ensureCurrencyRequestSchema.safeParse({ code: "USD" }).success).toBe(
      true
    )
    expect(ensureCurrencyRequestSchema.safeParse({ code: "US" }).success).toBe(
      false
    )
  })

  test("listPortsQuerySchema defaults q to empty string", () => {
    expect(listPortsQuerySchema.safeParse({}).success).toBe(true)
    expect(listPortsQuerySchema.parse({}).q).toBe("")
    expect(listPortsQuerySchema.parse({ q: "CNS" }).q).toBe("CNS")
  })

  test("listPortsResponseSchema parses facility options", () => {
    const parsed = listPortsResponseSchema.safeParse({
      ports: [
        {
          value: "CNSHA",
          label: "CNSHA — Shanghai",
          types: ["seaport"],
          country: "CN",
        },
      ],
    })
    expect(parsed.success).toBe(true)

    expect(
      listPortsResponseSchema.safeParse({
        ports: [{ value: "CNSHA" }],
      }).success
    ).toBe(false)
  })

  test("facilityInputSchema requires unlocode or iata", () => {
    expect(
      facilityInputSchema.safeParse({
        id: "CNSHA",
        unlocode: "CNSHA",
        name: "Shanghai",
        countryCode: "CN",
      }).success
    ).toBe(true)
    expect(
      facilityInputSchema.safeParse({
        id: "LAX",
        iata: "LAX",
        name: "Los Angeles International",
        countryCode: "US",
      }).success
    ).toBe(true)
    expect(
      facilityInputSchema.safeParse({
        id: "NOCODE",
        name: "Missing codes",
        countryCode: "US",
      }).success
    ).toBe(false)
  })
})

describe("crm contracts", () => {
  test("createCustomerRequestSchema requires a non-empty name", () => {
    expect(
      createCustomerRequestSchema.safeParse({ name: "Acme Freight" }).success
    ).toBe(true)
    expect(createCustomerRequestSchema.safeParse({ name: "  " }).success).toBe(
      false
    )
  })

  test("listCustomersResponseSchema parses customer options", () => {
    const parsed = listCustomersResponseSchema.safeParse({
      customers: [{ value: "cust-1", label: "Acme Freight" }],
    })
    expect(parsed.success).toBe(true)
  })

  test("getCustomerNamesQuerySchema splits comma-separated ids", () => {
    expect(getCustomerNamesQuerySchema.parse({ ids: "a, b, ,c" }).ids).toEqual([
      "a",
      "b",
      "c",
    ])
    expect(getCustomerNamesQuerySchema.parse({}).ids).toEqual([])
  })
})
