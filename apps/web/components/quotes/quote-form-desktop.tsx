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

export function QuoteFormDesktop(props: QuoteFormLayoutProps) {
  return (
    <>
      <div className="flex items-end justify-between gap-3 border-b pb-4">
        <QuoteIdField quoteId={props.quoteId} className="shrink-0" />
        <div className="flex flex-wrap items-end justify-end gap-3">
          <QuoteStatusField
            control={props.control}
            className="w-[8.5rem] shrink-0"
          />
          <QuoteCustomerField
            control={props.control}
            customerOptions={props.customerOptions}
            className="w-64 shrink-0"
          />
          <QuoteCurrencyField
            control={props.control}
            currencyOptions={props.currencyOptions}
            className="w-[7.5rem] shrink-0"
          />
          <QuoteEffectiveField
            register={props.register}
            errors={props.errors}
            className="w-[10.5rem] shrink-0"
          />
          <QuoteExpiryField
            register={props.register}
            errors={props.errors}
            className="w-[10.5rem] shrink-0"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
        <div className="min-w-0 flex-1 pr-4">
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
        <QuoteLanesPanel
          variant="sidebar"
          laneFields={props.laneFields}
          lanes={props.lanes}
          selectedLaneIndex={props.selectedLaneIndex}
          onSelectLane={props.onSelectLane}
          onAddLane={props.onAddLane}
          onRemoveLane={props.onRemoveLane}
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
