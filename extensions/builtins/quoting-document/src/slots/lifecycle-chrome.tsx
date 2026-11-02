"use client"

import {
  QuoteEffectiveField,
  QuoteExpiryField,
  QuoteIdField,
  QuoteStatusField,
} from "../components/quote-form-fields"
import { cn } from "@starboard/lib-ui/lib/utils"

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
  layout,
}: SlotComponentProps<LifecycleSlotProps>) {
  if (layout === "desktop") {
    return (
      <div
        data-testid="quote-lifecycle-chrome"
        className="flex flex-wrap items-end gap-3"
      >
        <QuoteIdField quoteId={quoteId} className="shrink-0" />
        <QuoteStatusField control={control} className="w-[8.5rem] shrink-0" />
        <QuoteEffectiveField
          register={register}
          errors={errors}
          className="w-[10.5rem] shrink-0"
        />
        <QuoteExpiryField
          register={register}
          errors={errors}
          className="w-[10.5rem] shrink-0"
        />
      </div>
    )
  }

  if (layout === "tablet") {
    return (
      <div data-testid="quote-lifecycle-chrome" className="contents">
        <QuoteIdField quoteId={quoteId} />
        <QuoteStatusField control={control} className="w-full" />
        <QuoteEffectiveField
          register={register}
          errors={errors}
          className="w-full"
        />
        <QuoteExpiryField
          register={register}
          errors={errors}
          className="w-full"
        />
      </div>
    )
  }

  return (
    <div data-testid="quote-lifecycle-chrome" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <QuoteIdField quoteId={quoteId} />
        <QuoteStatusField control={control} className="w-[8.5rem] shrink-0" />
      </div>
      <div className={cn("grid grid-cols-2 gap-3")}>
        <QuoteEffectiveField
          register={register}
          errors={errors}
          className="w-full"
        />
        <QuoteExpiryField
          register={register}
          errors={errors}
          className="w-full"
        />
      </div>
    </div>
  )
}
