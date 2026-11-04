import type { QuoteFormOption, QuoteFormValues } from "./quotes.schema"
import type { QuoteSlotContributions } from "../slots/types"
import { isCommercialEditable } from "./quote-stage"

/** `GET /api/quotes/:id/editor-context` payload (BFF composes service data). */
export type QuoteEditorContext = {
  /** Always present: the route answers 404 for unknown quotes. */
  quote: QuoteFormValues
  options: {
    customerOptions: QuoteFormOption[]
    currencyOptions: QuoteFormOption[]
    portOptions: QuoteFormOption[]
    containerTypeOptions: QuoteFormOption[]
    palletTypeOptions: QuoteFormOption[]
  }
  /** Active contributions to this extension's defined slots (host-resolved). */
  slots: QuoteSlotContributions
  /** Org Preferences → Quote defaults (absent / null = none). */
  defaults?: { baseCurrency?: string | null }
}

export type QuoteEditorInput = {
  defaultValues: QuoteFormValues
  customerOptions: QuoteFormOption[]
  currencyOptions: QuoteFormOption[]
  portOptions: QuoteFormOption[]
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
  slots: QuoteSlotContributions
}

/**
 * Turn the loaded context into `QuoteForm` props: saved currency / lane port
 * codes are guaranteed to have an option, and the first FCL container gets a
 * default type. Never invents a draft for an unknown quote id.
 */
export function prepareQuoteEditorInput(
  context: QuoteEditorContext
): QuoteEditorInput {
  const { options } = context
  const defaultValues: QuoteFormValues = structuredClone(context.quote)

  // Blank-currency commercial drafts take the org default base currency.
  const orgDefault = context.defaults?.baseCurrency?.trim().toUpperCase()
  if (
    orgDefault &&
    !defaultValues.currencyCode.trim() &&
    isCommercialEditable(defaultValues.status)
  ) {
    defaultValues.currencyCode = orgDefault
  }

  const currencies = [...options.currencyOptions]
  const ports = [...options.portOptions]
  const customers = [...options.customerOptions]

  // Saved customer stays selectable even if the server list omitted it
  // (inactive / paged out). The BFF normally supplies the real name.
  if (
    defaultValues.customerId &&
    !customers.some((option) => option.value === defaultValues.customerId)
  ) {
    customers.unshift({
      value: defaultValues.customerId,
      label: defaultValues.customerId,
    })
  }

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
    customerOptions: customers,
    currencyOptions: currencies,
    portOptions: ports,
    containerTypeOptions: options.containerTypeOptions,
    palletTypeOptions: options.palletTypeOptions,
    slots: context.slots ?? {},
  }
}
