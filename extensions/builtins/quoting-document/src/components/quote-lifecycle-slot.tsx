"use client"

import { useWatch } from "react-hook-form"

import type { QuoteStatus } from "@starboard/lib-contracts"

import { QuoteSlot } from "../slots/slot-host"
import { QUOTING_SLOTS, type LifecycleSlotProps } from "../slots/types"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"

/**
 * `quoting.slots.lifecycle` host: stage / validity / number chrome. Renders
 * nothing when `quoting.document` is inactive (no self-contribution).
 */
export function QuoteLifecycleSlot({
  props,
  className,
}: {
  props: QuoteFormLayoutProps
  className?: string
}) {
  const status = (useWatch({ control: props.control, name: "status" }) ??
    "draft") as QuoteStatus
  const slotProps: LifecycleSlotProps = {
    quoteId: props.quoteId,
    status,
    control: props.control,
    register: props.register,
    errors: props.errors,
    commercialEditable: props.commercialEditable,
  }
  return (
    <QuoteSlot
      point={QUOTING_SLOTS.lifecycle}
      props={slotProps}
      className={className}
    />
  )
}
