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

export function QuoteFormTablet(props: QuoteFormLayoutProps) {
  const locked = !props.commercialEditable
  return (
    <>
      <div className="grid grid-cols-4 gap-3 border-b pb-4">
        <QuoteLifecycleSlot
          props={props}
          layout="tablet"
          className="contents"
        />
        <QuoteCustomerField
          control={props.control}
          customerOptions={props.customerOptions}
          className="col-span-2 w-full"
          disabled={locked}
        />
        <QuoteCurrencyField
          control={props.control}
          currencyOptions={props.currencyOptions}
          className="w-full"
          disabled={locked}
        />
        <QuoteHeaderSlot props={props} layout="tablet" />
        <QuoteCommandsSlot props={props} className="col-span-4" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <QuoteLanesPanel
          variant="strip"
          laneFields={props.laneFields}
          lanes={props.lanes}
          selectedLaneIndex={props.selectedLaneIndex}
          onSelectLane={props.onSelectLane}
          onAddLane={props.onAddLane}
          onRemoveLane={props.onRemoveLane}
          commercialEditable={props.commercialEditable}
        />
        <div
          className={cn(locked && "pointer-events-none opacity-60")}
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
