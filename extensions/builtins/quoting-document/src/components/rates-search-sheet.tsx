"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@starboard/lib-ui/components/sheet"

import { QuoteSlot } from "../slots/slot-host"
import {
  QUOTING_SLOTS,
  type ApplyRatePayload,
  type RateSourcesSlotProps,
} from "../slots/types"

export type { ApplyRatePayload }

/**
 * Search-rates sheet. Owns only the chrome; every rate source (catalog, spot,
 * …) is contributed into `quoting.slots.rateSources` by its own extension.
 */
export function RatesSearchSheet({
  open,
  onOpenChange,
  origin,
  destination,
  onApplyRate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin?: string
  destination?: string
  onApplyRate: (payload: ApplyRatePayload) => void
}) {
  const slotProps: RateSourcesSlotProps = {
    origin,
    destination,
    onApplyRate: (payload) => {
      onApplyRate(payload)
      onOpenChange(false)
    },
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Search rates</SheetTitle>
          <SheetDescription>
            Catalog rates matching this lane
            {origin || destination
              ? ` (${[origin, destination].filter(Boolean).join(" → ")})`
              : ""}
            .
          </SheetDescription>
        </SheetHeader>
        <QuoteSlot
          point={QUOTING_SLOTS.rateSources}
          props={slotProps}
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-8"
        />
      </SheetContent>
    </Sheet>
  )
}
