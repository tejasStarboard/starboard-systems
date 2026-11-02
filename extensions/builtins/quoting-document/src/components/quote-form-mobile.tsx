"use client"

import { Button } from "@starboard/lib-ui/components/button"
import { Separator } from "@starboard/lib-ui/components/separator"
import { cn } from "@starboard/lib-ui/lib/utils"

import {
  QuoteCurrencyField,
  QuoteCustomerField,
  QuoteCustomerRoleField,
  QuoteIncotermField,
} from "./quote-form-fields"
import { QuoteCommandsSlot } from "./quote-commands-slot"
import { QuoteHeaderSlot } from "./quote-header-slot"
import { QuoteLifecycleSlot } from "./quote-lifecycle-slot"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"
import { QuoteLaneEditor } from "./quote-lane-editor"
import { QuoteLanesPanel } from "./quote-lanes-panel"

export function QuoteFormMobile(props: QuoteFormLayoutProps) {
  const locked = !props.commercialEditable
  return (
    <>
      <div className="flex flex-col gap-3 border-b pb-4">
        <QuoteLifecycleSlot props={props} layout="mobile" />
        <QuoteCustomerField
          control={props.control}
          customerOptions={props.customerOptions}
          className="w-full"
          disabled={locked}
        />
        <div className="grid grid-cols-2 gap-3">
          <QuoteCurrencyField
            control={props.control}
            currencyOptions={props.currencyOptions}
            className="w-full"
            disabled={locked}
          />
          <QuoteIncotermField
            control={props.control}
            className="w-full"
            disabled={locked}
          />
          <QuoteCustomerRoleField
            control={props.control}
            className="w-full"
            disabled={locked}
          />
        </div>
        <QuoteCommandsSlot props={props} />
      </div>

      <QuoteHeaderSlot {...props} />

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
            fullWidthActions
            commercialEditable={props.commercialEditable}
            onSearchRates={props.onSearchRates}
            onAddManualRate={props.onAddManualRate}
            onAppendRate={props.onAppendRate}
            onRemoveRate={props.onRemoveRate}
          />
        </div>
      </div>

      <Separator />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={props.pending || !props.isDirty}
        >
          {props.pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </>
  )
}
