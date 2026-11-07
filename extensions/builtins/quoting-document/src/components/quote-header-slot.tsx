"use client"

import { QuoteSlot } from "../slots/slot-host"
import { QUOTING_SLOTS, type HeaderFieldsSlotProps } from "../slots/types"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"

/**
 * `quoting.slots.headerFields` host: Incoterm / Role (and later siblings) from
 * contributed packages. Uses `contents` so fields participate in the parent
 * flex/grid. Renders nothing when no active contribution.
 */
export function QuoteHeaderSlot({
  props,
  className = "contents",
}: {
  props: QuoteFormLayoutProps
  className?: string
}) {
  const slotProps: HeaderFieldsSlotProps = {
    quoteId: props.quoteId,
    control: props.control,
    register: props.register,
    setValue: props.setValue,
    errors: props.errors,
    commercialEditable: props.commercialEditable,
  }
  return (
    <QuoteSlot
      point={QUOTING_SLOTS.headerFields}
      props={slotProps}
      className={className}
    />
  )
}
