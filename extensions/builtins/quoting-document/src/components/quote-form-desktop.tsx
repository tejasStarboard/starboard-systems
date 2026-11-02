"use client"

import { Button } from "@starboard/lib-ui/components/button"
import { Separator } from "@starboard/lib-ui/components/separator"
import { cn } from "@starboard/lib-ui/lib/utils"

import { QuoteCurrencyField, QuoteCustomerField } from "./quote-form-fields"
import { QuoteCommandsSlot } from "./quote-commands-slot"
import { QuoteHeaderSlot } from "./quote-header-slot"
import { QuoteLifecycleSlot } from "./quote-lifecycle-slot"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"
import { QuoteLaneEditor } from "./quote-lane-editor"
import { QuoteLanesPanel } from "./quote-lanes-panel"

export function QuoteFormDesktop(props: QuoteFormLayoutProps) {
  const locked = !props.commercialEditable
  return (
    <>
      <div className="flex items-end justify-between gap-3 border-b pb-4">
        <QuoteLifecycleSlot props={props} layout="desktop" />
        <div className="flex flex-wrap items-end justify-end gap-3">
          <QuoteCustomerField
            control={props.control}
            customerOptions={props.customerOptions}
            className="w-64 shrink-0"
            disabled={locked}
          />
          <QuoteCurrencyField
            control={props.control}
            currencyOptions={props.currencyOptions}
            className="w-[7.5rem] shrink-0"
            disabled={locked}
          />
          <QuoteHeaderSlot props={props} layout="desktop" />
          <QuoteCommandsSlot props={props} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
        <div
          className={cn(
            "min-w-0 flex-1 pr-4",
            locked && "pointer-events-none opacity-60"
          )}
          aria-disabled={locked || undefined}
        >
          <QuoteLaneEditor
            control={props.control}
            register={props.register}
            setValue={props.setValue}
            selectedLane={props.selectedLane}
            selectedLaneIndex={props.selectedLaneIndex}
            selectedLaneId={props.selectedLaneId}
            lanePath={props.lanePath}
            laneReady={props.laneReady}
            rateFields={props.rateFields}
            manualRatesVisible={props.manualRatesVisible}
            totals={props.totals}
            excludedBuckets={props.excludedBuckets}
            currencyCode={props.currencyCode}
            portOptions={props.portOptions}
            containerTypeOptions={props.containerTypeOptions}
            palletTypeOptions={props.palletTypeOptions}
            commercialEditable={props.commercialEditable}
            onSearchRates={props.onSearchRates}
            onAddManualRate={props.onAddManualRate}
            onAppendRate={props.onAppendRate}
            onRemoveRate={props.onRemoveRate}
          />
        </div>
        <QuoteLanesPanel
          variant="sidebar"
          laneFields={props.laneFields}
          lanes={props.lanes}
          selectedLaneIndex={props.selectedLaneIndex}
          onSelectLane={props.onSelectLane}
          onAddLane={props.onAddLane}
          onRemoveLane={props.onRemoveLane}
          commercialEditable={props.commercialEditable}
        />
      </div>

      <Separator />
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={props.pending || !props.isDirty}>
          {props.pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </>
  )
}
