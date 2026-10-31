"use client"

import { Button } from "@starboard/lib-ui/components/button"
import { Separator } from "@starboard/lib-ui/components/separator"

import {
  QuoteCurrencyField,
  QuoteCustomerField,
  QuoteEffectiveField,
  QuoteExpiryField,
  QuoteIdField,
  QuoteStatusField,
} from "@/components/quotes/quote-form-fields"
import type { QuoteFormLayoutProps } from "@/components/quotes/quote-form-layout-props"
import { QuoteLaneEditor } from "@/components/quotes/quote-lane-editor"
import { QuoteLanesPanel } from "@/components/quotes/quote-lanes-panel"

export function QuoteFormTablet(props: QuoteFormLayoutProps) {
  return (
    <>
      <div className="grid grid-cols-4 gap-3 border-b pb-4">
        <QuoteIdField quoteId={props.quoteId} />
        <QuoteStatusField control={props.control} className="w-full" />
        <QuoteCustomerField
          control={props.control}
          customerOptions={props.customerOptions}
          className="col-span-2 w-full"
        />
        <QuoteCurrencyField
          control={props.control}
          currencyOptions={props.currencyOptions}
          className="w-full"
        />
        <QuoteEffectiveField
          register={props.register}
          errors={props.errors}
          className="w-full"
        />
        <QuoteExpiryField
          register={props.register}
          errors={props.errors}
          className="w-full"
        />
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
        />
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
          currencyCode={props.currencyCode}
          portOptions={props.portOptions}
          containerTypeOptions={props.containerTypeOptions}
          palletTypeOptions={props.palletTypeOptions}
          onSearchRates={props.onSearchRates}
          onAddManualRate={props.onAddManualRate}
          onAppendRate={props.onAppendRate}
          onRemoveRate={props.onRemoveRate}
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
