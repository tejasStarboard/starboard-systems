"use client"

import {
  QuoteEffectiveField,
  QuoteExpiryField,
  QuoteIdField,
  QuoteStatusField,
} from "../components/quote-form-fields"

import type { LifecycleSlotProps, SlotComponentProps } from "./types"

/**
 * Self-contribution for `quoting.slots.lifecycle`: quote number, stage, and
 * validity window. Mounts only while `quoting.document` is active.
 */
export function LifecycleChrome({
  quoteId,
  control,
  register,
  errors,
  commercialEditable,
}: SlotComponentProps<LifecycleSlotProps>) {
  return (
    <div
      data-testid="quote-lifecycle-chrome"
      className="flex w-full min-w-0 flex-wrap items-end justify-between gap-3"
    >
      <div className="flex items-center gap-2">
        <QuoteIdField quoteId={quoteId} className="w-auto shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <QuoteStatusField control={control} className="w-32 shrink-0" />
        <QuoteEffectiveField
          register={register}
          errors={errors}
          disabled={!commercialEditable}
          className="w-40 shrink-0"
        />
        <QuoteExpiryField
          register={register}
          errors={errors}
          disabled={!commercialEditable}
          className="w-40 shrink-0"
        />
      </div>
    </div>
  )
}
