"use client"

import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react"
import {
  type Control,
  type FieldArrayWithId,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import { cn } from "@starboard/lib-ui/lib/utils"

import { LaneFields } from "./lane-fields"
import { QuoteSlot, useQuoteSlotEntries } from "../slots/slot-host"
import {
  QUOTING_SLOTS,
  type ChargeTableSlotProps,
  type TotalsSlotProps,
} from "../slots/types"
import type {
  LaneFormValues,
  QuoteFormOption,
  QuoteFormValues,
} from "../lib/quotes.schema"

function laneListLabel(lane: LaneFormValues | undefined, index: number) {
  if (!lane) {
    return `Lane ${index + 1}`
  }
  const origin = lane.origin.trim()
  const destination = lane.destination.trim()
  if (origin && destination) {
    return `${origin} → ${destination}`
  }
  if (origin || destination) {
    return origin || destination
  }
  return `Lane ${index + 1}`
}

export function QuoteLaneEditor({
  control,
  register,
  setValue,
  selectedLane,
  selectedLaneIndex,
  selectedLaneId,
  lanePath,
  laneReady,
  rateFields,
  manualRatesVisible,
  totals,
  excludedBuckets,
  currencyCode,
  portOptions,
  containerTypeOptions,
  palletTypeOptions,
  fullWidthActions,
  commercialEditable = true,
  onSearchRates,
  onAddManualRate,
  onAppendRate,
  onRemoveRate,
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
  selectedLane: LaneFormValues | undefined
  selectedLaneIndex: number
  selectedLaneId: string | undefined
  lanePath: `lanes.${number}`
  laneReady: boolean
  rateFields: FieldArrayWithId<
    QuoteFormValues,
    `lanes.${number}.manualRates`,
    "id"
  >[]
  manualRatesVisible: boolean
  totals: { subtotal: number; markup: number; total: number }
  excludedBuckets: Array<"origin" | "freight" | "destination">
  currencyCode: string
  portOptions: QuoteFormOption[]
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
  fullWidthActions?: boolean
  commercialEditable?: boolean
  onSearchRates: () => void
  onAddManualRate: () => void
  onAppendRate: () => void
  onRemoveRate: (index: number) => void
}) {
  // Rate sources / charge grid are contributed. Rates are applied into the
  // charge table, so search/apply need BOTH; without a charge table the lane's
  // existing manual rates are left untouched (never mutated invisibly).
  const hasRateSources =
    useQuoteSlotEntries(QUOTING_SLOTS.rateSources).length > 0
  const hasChargeTable =
    useQuoteSlotEntries(QUOTING_SLOTS.chargeTable).length > 0

  const chargeTableProps: ChargeTableSlotProps = {
    control,
    register,
    setValue,
    lanePath,
    rateFields,
    currencyCode,
    excludedBuckets,
    onAppendRate,
    onRemoveRate,
  }
  const totalsProps: TotalsSlotProps = {
    control,
    register,
    setValue,
    lanePath,
    currencyCode,
    totals,
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">
          {laneListLabel(selectedLane, selectedLaneIndex)}
        </h2>
        <p className="text-xs text-muted-foreground">
          Choose a mode and set the route. Rate actions unlock once origin and
          destination are set.
        </p>
      </div>

      <LaneFields
        key={selectedLaneId ?? selectedLaneIndex}
        control={control}
        register={register}
        setValue={setValue}
        laneIndex={selectedLaneIndex}
        portOptions={portOptions}
        containerTypeOptions={containerTypeOptions}
        palletTypeOptions={palletTypeOptions}
      />

      <div
        className={cn(
          "flex gap-2",
          fullWidthActions ? "flex-col" : "flex-wrap"
        )}
      >
        {hasRateSources && hasChargeTable ? (
          <Button
            type="button"
            variant="outline"
            className={cn(fullWidthActions && "w-full")}
            disabled={!laneReady || !commercialEditable}
            onClick={onSearchRates}
          >
            <MagnifyingGlassIcon data-icon="inline-start" />
            Search rates
          </Button>
        ) : null}
        {hasChargeTable ? (
          <Button
            type="button"
            variant="outline"
            className={cn(fullWidthActions && "w-full")}
            disabled={!laneReady || !commercialEditable}
            onClick={onAddManualRate}
          >
            <PlusIcon data-icon="inline-start" />
            Add manual rate
          </Button>
        ) : null}
      </div>

      {!hasChargeTable && (rateFields.length > 0 || hasRateSources) ? (
        <p
          role="status"
          data-testid="charges-unavailable"
          className="text-xs text-muted-foreground"
        >
          Charges are unavailable (the quote charges extension is off).
          {rateFields.length > 0
            ? ` ${rateFields.length} existing charge${rateFields.length === 1 ? "" : "s"} on this lane are kept unchanged and totals are hidden.`
            : " Rate search is disabled."}
        </p>
      ) : null}

      {manualRatesVisible && hasChargeTable ? (
        <div className="space-y-4 border-t pt-4">
          <QuoteSlot
            point={QUOTING_SLOTS.chargeTable}
            props={chargeTableProps}
            className="space-y-4"
          />

          {excludedBuckets.length > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Excluded by Incoterm: {excludedBuckets.join(", ")}.
            </p>
          ) : null}

          <QuoteSlot
            point={QUOTING_SLOTS.totals}
            props={totalsProps}
            className="flex flex-col gap-3"
          />
        </div>
      ) : null}
    </section>
  )
}
