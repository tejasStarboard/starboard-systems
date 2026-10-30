"use client"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

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

export function QuoteFormMobile(props: QuoteFormLayoutProps) {
  return (
    <>
      <div className="flex flex-col gap-3 border-b pb-4">
        <div className="flex items-end justify-between gap-3">
          <QuoteIdField quoteId={props.quoteId} />
          <QuoteStatusField
            control={props.control}
            className="w-[8.5rem] shrink-0"
          />
        </div>
        <QuoteCustomerField
          control={props.control}
          customerOptions={props.customerOptions}
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-3">
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
        </div>
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
          containerTypeOptions={props.containerTypeOptions}
          palletTypeOptions={props.palletTypeOptions}
          fullWidthActions
          onSearchRates={props.onSearchRates}
          onAddManualRate={props.onAddManualRate}
          onAppendRate={props.onAppendRate}
          onRemoveRate={props.onRemoveRate}
        />
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
