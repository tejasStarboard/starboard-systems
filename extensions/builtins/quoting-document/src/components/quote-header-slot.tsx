"use client"

import { QuoteSlot } from "../slots/slot-host"
import { QUOTING_SLOTS, type HeaderFieldsSlotProps } from "../slots/types"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"

/**
 * `quoting.slots.headerFields` host: extra header fields (Incoterm, …) from
 * sibling extensions. Renders nothing when no active contribution.
 */
export function QuoteHeaderSlot(props: QuoteFormLayoutProps) {
  const slotProps: HeaderFieldsSlotProps = {
    quoteId: props.quoteId,
    control: props.control,
    register: props.register,
    setValue: props.setValue,
    errors: props.errors,
  }
  return (
    <QuoteSlot
      point={QUOTING_SLOTS.headerFields}
      props={slotProps}
      className="flex flex-wrap items-end gap-3 border-b pb-4"
    />
  )
}
