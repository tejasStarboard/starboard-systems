"use client"

import { PlusIcon } from "@phosphor-icons/react"

import { Button } from "@starboard/lib-ui/components/button"
import { cn } from "@starboard/lib-ui/lib/utils"

import { LaneCargoFields } from "./lane-cargo-fields"
import { LaneRouteFields } from "./lane-route-fields"
import { QuoteCurrencyField, QuoteCustomerField } from "./quote-form-fields"
import { QuoteHeaderSlot } from "./quote-header-slot"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"
import { resolveSelectedManualRate } from "../lib/quotes.schema"
import { QUOTE_STEPS, type QuoteStepId } from "../lib/quote-builder-steps"
import { QuoteSlot, useQuoteSlotEntries } from "../slots/slot-host"
import {
  QUOTING_SLOTS,
  type ChargeTableSlotProps,
  type RateSourcesSlotProps,
  type TotalsSlotProps,
} from "../slots/types"

type Layout = "desktop" | "tablet" | "mobile"

function laneLabel(props: QuoteFormLayoutProps) {
  const origin = props.selectedLane?.origin.trim() ?? ""
  const destination = props.selectedLane?.destination.trim() ?? ""
  if (origin && destination) return `${origin} → ${destination}`
  return origin || destination || `Lane ${props.selectedLaneIndex + 1}`
}

function StepHeading({
  step,
  props,
}: {
  step: QuoteStepId
  props: QuoteFormLayoutProps
}) {
  const meta = QUOTE_STEPS.find((entry) => entry.id === step)
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-medium">
        {meta?.label}
        {meta?.scope === "lane" ? (
          <span className="ml-2 font-normal text-muted-foreground">
            {laneLabel(props)}
          </span>
        ) : null}
      </h2>
      <p className="text-xs text-muted-foreground">{meta?.hint}</p>
    </div>
  )
}

function RatesStep({
  props,
  fullWidthActions,
}: {
  props: QuoteFormLayoutProps
  fullWidthActions: boolean
}) {
  // Rates are applied into the charge table, so search/apply need BOTH slots;
  // without a charge table existing manual rates are left untouched.
  const hasRateSources =
    useQuoteSlotEntries(QUOTING_SLOTS.rateSources).length > 0
  const hasChargeTable =
    useQuoteSlotEntries(QUOTING_SLOTS.chargeTable).length > 0
  const locked = !props.commercialEditable
  const rateCount = props.rateFields.length
  const canSearchRates =
    hasRateSources && hasChargeTable && props.laneReady && !locked
  const selectedManualRate = resolveSelectedManualRate(
    props.selectedLane?.manualRates ?? [],
    props.selectedLane?.selectedRateId
  )
  const rateSourcesProps: RateSourcesSlotProps = {
    origin: props.selectedLane?.origin.trim() || undefined,
    destination: props.selectedLane?.destination.trim() || undefined,
    selectedRate: selectedManualRate
      ? { label: selectedManualRate.label, amount: selectedManualRate.amount }
      : null,
    onApplyRate: props.onApplyRate,
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex gap-2",
          fullWidthActions ? "flex-col" : "flex-wrap"
        )}
      >
        {hasChargeTable ? (
          <Button
            type="button"
            variant="outline"
            className={cn(fullWidthActions && "w-full")}
            disabled={!props.laneReady || locked}
            onClick={props.onAddManualRate}
          >
            <PlusIcon data-icon="inline-start" />
            Add manual rate
          </Button>
        ) : null}
      </div>

      {!hasChargeTable && (rateCount > 0 || hasRateSources) ? (
        <p
          role="status"
          data-testid="charges-unavailable"
          className="text-xs text-muted-foreground"
        >
          Charges are unavailable (the quote charges extension is off).
          {rateCount > 0
            ? ` ${rateCount} existing charge${rateCount === 1 ? "" : "s"} on this lane are kept unchanged and totals are hidden.`
            : " Rate search is disabled."}
        </p>
      ) : null}

      {canSearchRates ? (
        <QuoteSlot
          point={QUOTING_SLOTS.rateSources}
          props={rateSourcesProps}
          className="flex min-w-0 flex-col gap-4"
        />
      ) : null}

      {hasRateSources && hasChargeTable && !canSearchRates ? (
        <p
          data-testid="rates-unavailable"
          className="text-xs text-muted-foreground"
        >
          {locked
            ? "This quote is closed, so rates can no longer be changed."
            : "Complete the route and cargo to see rates for this lane."}
        </p>
      ) : null}

      {hasChargeTable ? (
        <p
          data-testid="rates-summary"
          className="border border-dashed p-3 text-xs text-muted-foreground"
        >
          {rateCount === 0
            ? "No rate on this lane yet. Select a rate card or add one manually."
            : `${rateCount} rate${rateCount === 1 ? "" : "s"} on this lane. Review charges and totals in Build.`}
        </p>
      ) : null}
    </div>
  )
}

function BuildStep({
  props,
  onStepChange,
}: {
  props: QuoteFormLayoutProps
  onStepChange: (step: QuoteStepId) => void
}) {
  const hasChargeTable =
    useQuoteSlotEntries(QUOTING_SLOTS.chargeTable).length > 0

  if (!hasChargeTable) {
    return (
      <p
        role="status"
        data-testid="charges-unavailable"
        className="text-xs text-muted-foreground"
      >
        Charges are unavailable (the quote charges extension is off).
        {props.rateFields.length > 0
          ? ` ${props.rateFields.length} existing charge${props.rateFields.length === 1 ? "" : "s"} on this lane are kept unchanged and totals are hidden.`
          : ""}
      </p>
    )
  }

  if (!props.manualRatesVisible) {
    return (
      <div className="space-y-2 border border-dashed p-3">
        <p className="text-xs text-muted-foreground">
          No charges on this lane yet. Pick or add a rate first.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onStepChange("rates")}
        >
          Go to Rates
        </Button>
      </div>
    )
  }

  const chargeTableProps: ChargeTableSlotProps = {
    control: props.control,
    register: props.register,
    setValue: props.setValue,
    lanePath: props.lanePath,
    rateFields: props.rateFields,
    currencyCode: props.currencyCode,
    excludedBuckets: props.excludedBuckets,
    onAppendRate: props.onAppendRate,
    onRemoveRate: props.onRemoveRate,
  }
  const totalsProps: TotalsSlotProps = {
    control: props.control,
    register: props.register,
    setValue: props.setValue,
    lanePath: props.lanePath,
    currencyCode: props.currencyCode,
    totals: props.totals,
  }

  return (
    <div className="space-y-4">
      <QuoteSlot
        point={QUOTING_SLOTS.chargeTable}
        props={chargeTableProps}
        className="space-y-4"
      />
      {props.excludedBuckets.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Excluded by Incoterm: {props.excludedBuckets.join(", ")}.
        </p>
      ) : null}
      <QuoteSlot
        point={QUOTING_SLOTS.totals}
        props={totalsProps}
        className="flex flex-col gap-3"
      />
    </div>
  )
}

/**
 * Body of the active step. Step 1 is quote-level (customer, currency,
 * `headerFields`); steps 2–5 operate on the selected lane. Existing slots
 * remount where they belong: `headerFields` → Basics, `rateSources` → Rates,
 * `chargeTable` / `totals` → Build.
 */
export function QuoteStepContent({
  step,
  props,
  layout,
  onStepChange,
}: {
  step: QuoteStepId
  props: QuoteFormLayoutProps
  layout: Layout
  onStepChange: (step: QuoteStepId) => void
}) {
  const locked = !props.commercialEditable
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <StepHeading step={step} props={props} />

      {step === "basics" ? (
        <div
          className={cn(
            "grid gap-4",
            layout === "mobile" ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          <QuoteCustomerField
            control={props.control}
            customerOptions={props.customerOptions}
            className={cn("w-full", layout !== "mobile" && "col-span-2")}
            disabled={locked}
          />
          <QuoteCurrencyField
            control={props.control}
            currencyOptions={props.currencyOptions}
            className="w-full"
            disabled={locked}
          />
          <QuoteHeaderSlot props={props} layout={layout} />
        </div>
      ) : null}

      {step === "route" ? (
        <LaneRouteFields
          key={props.selectedLaneId ?? props.selectedLaneIndex}
          control={props.control}
          setValue={props.setValue}
          laneIndex={props.selectedLaneIndex}
          portOptions={props.portOptions}
          containerTypeOptions={props.containerTypeOptions}
          palletTypeOptions={props.palletTypeOptions}
        />
      ) : null}

      {step === "cargo" ? (
        <LaneCargoFields
          key={props.selectedLaneId ?? props.selectedLaneIndex}
          control={props.control}
          register={props.register}
          laneIndex={props.selectedLaneIndex}
          containerTypeOptions={props.containerTypeOptions}
          palletTypeOptions={props.palletTypeOptions}
        />
      ) : null}

      {step === "rates" ? (
        <RatesStep props={props} fullWidthActions={layout === "mobile"} />
      ) : null}

      {step === "build" ? (
        <BuildStep props={props} onStepChange={onStepChange} />
      ) : null}
    </div>
  )
}
