import { describe, expect, test } from "bun:test"

import { ensureCurrencyRequestSchema } from "./geography"
import {
  calculateManualRateTotals,
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

  test("calculateManualRateTotals applies percent markup", () => {
    expect(
      calculateManualRateTotals({
        lines: [{ amount: 100 }, { amount: 50 }],
        markupType: "percent",
        markupValue: 10,
      })
    ).toEqual({ subtotal: 150, markup: 15, total: 165 })
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
})
