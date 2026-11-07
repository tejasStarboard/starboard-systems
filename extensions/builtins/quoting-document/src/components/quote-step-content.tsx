"use client"

import { useState } from "react"
import { PlusIcon, QuestionIcon } from "@phosphor-icons/react"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@starboard/lib-ui/components/tooltip"

import { LaneCargoFields } from "./lane-cargo-fields"
import { LaneRouteFields } from "./lane-route-fields"
import { QuoteCurrencyField, QuoteCustomerField } from "./quote-form-fields"
import { QuoteHeaderSlot } from "./quote-header-slot"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"
import { QUOTE_STEPS, type QuoteStepId } from "../lib/quote-builder-steps"
import { QuoteSlot, useQuoteSlotEntries } from "../slots/slot-host"
import {
  QUOTING_SLOTS,
  type ChargeTableSlotProps,
  type RateSourcesSlotProps,
  type TotalsSlotProps,
} from "../slots/types"

function RatesSection({ props }: { props: QuoteFormLayoutProps }) {
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
  // Strict: only an explicit `selectedRateId` that resolves to an existing line
  // counts. (`resolveSelectedManualRate` falls back to the first rate for
  // pricing; a card must not claim "Selected" off that fallback.)
  const selectedRateId = props.selectedLane?.selectedRateId
  const selectedManualRate = selectedRateId
    ? props.selectedLane?.manualRates.find((rate) => rate.id === selectedRateId)
    : undefined
  const rateSourcesProps: RateSourcesSlotProps = {
    origin: props.selectedLane?.origin.trim() || undefined,
    destination: props.selectedLane?.destination.trim() || undefined,
    selectedRate: selectedManualRate
      ? {
          id: selectedManualRate.id,
          label: selectedManualRate.label,
          amount: selectedManualRate.amount,
        }
      : null,
    onApplyRate: props.onApplyRate,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {hasChargeTable ? (
          <Button
            type="button"
            variant="outline"
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
            : `${rateCount} rate${rateCount === 1 ? "" : "s"} on this lane.`}
        </p>
      ) : null}
    </div>
  )
}

function BuildSection({ props }: { props: QuoteFormLayoutProps }) {
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
      <p className="border border-dashed p-3 text-xs text-muted-foreground">
        No charges on this lane yet. Pick or add a rate above.
      </p>
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
 * Body of the active step.
 * Route → ports + cargo. Rate → basics + rate sources + charges/totals.
 */
export function QuoteStepContent({
  step,
  props,
}: {
  step: QuoteStepId
  props: QuoteFormLayoutProps
}) {
  const locked = !props.commercialEditable
  const [ratesVisited, setRatesVisited] = useState(step === "rate")
  if (step === "rate" && !ratesVisited) setRatesVisited(true)
  const ratesMounted = step === "rate" || ratesVisited

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {step === "route" ? (
        <>
          <LaneRouteFields
            key={`route-${props.selectedLaneId ?? props.selectedLaneIndex}`}
            control={props.control}
            setValue={props.setValue}
            laneIndex={props.selectedLaneIndex}
            portOptions={props.portOptions}
            containerTypeOptions={props.containerTypeOptions}
            palletTypeOptions={props.palletTypeOptions}
          />
          <LaneCargoFields
            key={`cargo-${props.selectedLaneId ?? props.selectedLaneIndex}`}
            control={props.control}
            register={props.register}
            laneIndex={props.selectedLaneIndex}
            containerTypeOptions={props.containerTypeOptions}
            palletTypeOptions={props.palletTypeOptions}
          />
        </>
      ) : null}

      {step === "rate" ? (
        <div className="grid grid-cols-2 gap-4">
          <QuoteCustomerField
            control={props.control}
            customerOptions={props.customerOptions}
            className="col-span-2 w-full"
            disabled={locked}
          />
          <QuoteCurrencyField
            control={props.control}
            currencyOptions={props.currencyOptions}
            fx={props.fx}
            className="w-full"
            disabled={locked}
          />
          <QuoteHeaderSlot props={props} />
        </div>
      ) : null}

      {/* Kept mounted (hidden) once visited so in-progress / completed spot
          searches survive step navigation; rate sources reset themselves when
          the lane's ports change. */}
      {ratesMounted ? (
        <div hidden={step !== "rate"}>
          <RatesSection props={props} />
        </div>
      ) : null}

      {step === "rate" ? <BuildSection props={props} /> : null}
    </div>
  )
}
