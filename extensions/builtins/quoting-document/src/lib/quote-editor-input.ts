import {
  emptyQuoteFormValues,
  type QuoteFormOption,
  type QuoteFormValues,
} from "./quotes.schema"
import type { SpotRateSource } from "./spot-rate-source"

/** `GET /api/quotes/:id/editor-context` payload (BFF composes service data). */
export type QuoteEditorContext = {
  quote: QuoteFormValues | null
  options: {
    customerOptions: QuoteFormOption[]
    currencyOptions: QuoteFormOption[]
    portOptions: QuoteFormOption[]
    containerTypeOptions: QuoteFormOption[]
    palletTypeOptions: QuoteFormOption[]
  }
  spotRateSources: SpotRateSource[]
}

export type QuoteEditorInput = {
  defaultValues: QuoteFormValues
  customerOptions: QuoteFormOption[]
  currencyOptions: QuoteFormOption[]
  portOptions: QuoteFormOption[]
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
  spotRateSources: SpotRateSource[]
}

/**
 * Turn the loaded context into `QuoteForm` props: an unsaved quote id gets an
 * empty draft, saved currency / lane port codes are guaranteed to have an
 * option, and the first FCL container gets a default type.
 */
export function prepareQuoteEditorInput(
  quoteId: string,
  context: QuoteEditorContext
): QuoteEditorInput {
  const { options } = context
  const defaultValues: QuoteFormValues = structuredClone(
    context.quote ?? emptyQuoteFormValues({ id: quoteId })
  )

  const currencies = [...options.currencyOptions]
  const ports = [...options.portOptions]

  if (
    defaultValues.currencyCode &&
    !currencies.some((option) => option.value === defaultValues.currencyCode)
  ) {
    currencies.unshift({
      value: defaultValues.currencyCode,
      label: defaultValues.currencyCode,
    })
  }

  for (const lane of defaultValues.lanes) {
    for (const code of [
      lane.origin,
      lane.destination,
      lane.originVia,
      lane.destinationVia,
    ]) {
      const trimmed = code.trim()
      if (trimmed && !ports.some((option) => option.value === trimmed)) {
        ports.push({ value: trimmed, label: trimmed })
      }
    }
  }

  const firstLane = defaultValues.lanes[0]
  const firstContainer = firstLane?.containers[0]
  const defaultContainerType = options.containerTypeOptions[0]?.value
  if (
    firstLane?.mode === "fcl" &&
    firstContainer &&
    !firstContainer.containerType &&
    defaultContainerType
  ) {
    firstContainer.containerType = defaultContainerType
  }

  return {
    defaultValues,
    customerOptions: options.customerOptions,
    currencyOptions: currencies,
    portOptions: ports,
    containerTypeOptions: options.containerTypeOptions,
    palletTypeOptions: options.palletTypeOptions,
    spotRateSources: context.spotRateSources,
  }
}
