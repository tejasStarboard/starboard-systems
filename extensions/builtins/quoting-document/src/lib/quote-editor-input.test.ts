import { describe, expect, test } from "bun:test"

import {
  prepareQuoteEditorInput,
  type QuoteEditorContext,
} from "./quote-editor-input"
import { emptyQuoteFormValues } from "./quotes.schema"

function context(overrides: Partial<QuoteEditorContext> = {}) {
  return {
    quote: null,
    options: {
      customerOptions: [],
      currencyOptions: [{ value: "USD", label: "USD" }],
      portOptions: [],
      containerTypeOptions: [{ value: "40HC", label: "40HC" }],
      palletTypeOptions: [],
    },
    spotRateSources: [],
    ...overrides,
  } satisfies QuoteEditorContext
}

describe("prepareQuoteEditorInput", () => {
  test("unsaved quote id gets an empty draft with default container type", () => {
    const input = prepareQuoteEditorInput("q-1", context())
    expect(input.defaultValues.id).toBe("q-1")
    expect(input.defaultValues.lanes[0]?.containers[0]?.containerType).toBe(
      "40HC"
    )
  })

  test("saved currency and lane ports are always selectable", () => {
    const quote = emptyQuoteFormValues({ id: "q-2" })
    quote.currencyCode = "EUR"
    quote.lanes[0]!.origin = "NLRTM"
    const input = prepareQuoteEditorInput("q-2", context({ quote }))
    expect(input.currencyOptions[0]).toEqual({ value: "EUR", label: "EUR" })
    expect(input.portOptions.map((p) => p.value)).toContain("NLRTM")
    // Input context is not mutated.
    expect(quote.lanes[0]!.containers[0]?.containerType ?? "").toBe("")
  })
})
