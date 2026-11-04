import { describe, expect, test } from "bun:test"

import {
  prepareQuoteEditorInput,
  type QuoteEditorContext,
} from "./quote-editor-input"
import { emptyQuoteFormValues } from "./quotes.schema"

function context(overrides: Partial<QuoteEditorContext> = {}) {
  return {
    quote: emptyQuoteFormValues({ id: "q-1" }),
    options: {
      customerOptions: [],
      currencyOptions: [{ value: "USD", label: "USD" }],
      portOptions: [],
      containerTypeOptions: [{ value: "40HC", label: "40HC" }],
      palletTypeOptions: [],
    },
    slots: {},
    ...overrides,
  } satisfies QuoteEditorContext
}

describe("prepareQuoteEditorInput", () => {
  test("loaded quote gets a default container type", () => {
    const input = prepareQuoteEditorInput(context())
    expect(input.defaultValues.id).toBe("q-1")
    expect(input.defaultValues.lanes[0]?.containers[0]?.containerType).toBe(
      "40HC"
    )
  })

  test("saved currency and lane ports are always selectable", () => {
    const quote = emptyQuoteFormValues({ id: "q-2" })
    quote.currencyCode = "EUR"
    quote.lanes[0]!.origin = "NLRTM"
    const input = prepareQuoteEditorInput(context({ quote }))
    expect(input.currencyOptions[0]).toEqual({ value: "EUR", label: "EUR" })
    expect(input.portOptions.map((p) => p.value)).toContain("NLRTM")
    // Input context is not mutated.
    expect(quote.lanes[0]!.containers[0]?.containerType ?? "").toBe("")
  })

  test("saved customer is injected when missing from the option list", () => {
    const quote = emptyQuoteFormValues({ id: "q-3", customerId: "cust-9" })
    const input = prepareQuoteEditorInput(context({ quote }))
    expect(input.customerOptions.map((o) => o.value)).toContain("cust-9")
  })

  test("saved customer keeps its server label when already listed", () => {
    const quote = emptyQuoteFormValues({ id: "q-4", customerId: "cust-1" })
    const base = context({ quote })
    base.options.customerOptions = [{ value: "cust-1", label: "Acme" }]
    const input = prepareQuoteEditorInput(base)
    expect(input.customerOptions).toEqual([{ value: "cust-1", label: "Acme" }])
  })

  test("blank-currency draft takes the org default base currency", () => {
    const input = prepareQuoteEditorInput(
      context({ defaults: { baseCurrency: "eur" } })
    )
    expect(input.defaultValues.currencyCode).toBe("EUR")
    expect(input.currencyOptions.map((o) => o.value)).toContain("EUR")
  })

  test("org default never overrides a saved currency or a terminal quote", () => {
    const saved = emptyQuoteFormValues({ id: "q-5" })
    saved.currencyCode = "USD"
    expect(
      prepareQuoteEditorInput(
        context({ quote: saved, defaults: { baseCurrency: "EUR" } })
      ).defaultValues.currencyCode
    ).toBe("USD")

    const won = emptyQuoteFormValues({ id: "q-6" })
    won.status = "win"
    expect(
      prepareQuoteEditorInput(
        context({ quote: won, defaults: { baseCurrency: "EUR" } })
      ).defaultValues.currencyCode
    ).toBe("")
  })
})
