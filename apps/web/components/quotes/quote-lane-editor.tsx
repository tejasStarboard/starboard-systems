"use client"

import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import {
  Controller,
  type Control,
  type FieldArrayWithId,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import { Field, FieldLabel } from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@starboard/lib-ui/components/table"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@starboard/lib-ui/components/toggle-group"
import { cn } from "@starboard/lib-ui/lib/utils"

import { LaneFields } from "@/components/quotes/lane-fields"
import type {
  LaneFormValues,
  QuoteFormOption,
  QuoteFormValues,
} from "@/lib/domain/quotes/quotes.schema"

function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return value.toFixed(2)
  }
}

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
  currencyCode,
  portOptions,
  containerTypeOptions,
  palletTypeOptions,
  fullWidthActions,
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
  currencyCode: string
  portOptions: QuoteFormOption[]
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
  fullWidthActions?: boolean
  onSearchRates: () => void
  onAddManualRate: () => void
  onAppendRate: () => void
  onRemoveRate: (index: number) => void
}) {
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
        <Button
          type="button"
          variant="outline"
          className={cn(fullWidthActions && "w-full")}
          disabled={!laneReady}
          onClick={onSearchRates}
        >
          <MagnifyingGlassIcon data-icon="inline-start" />
          Search rates
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(fullWidthActions && "w-full")}
          disabled={!laneReady}
          onClick={onAddManualRate}
        >
          <PlusIcon data-icon="inline-start" />
          Add manual rate
        </Button>
      </div>

      {manualRatesVisible ? (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Manual rates</h3>
            <p className="text-xs text-muted-foreground">
              Build an invoice-style breakdown for this lane.
            </p>
          </div>

          <div className="overflow-x-auto rounded-none border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Charge</TableHead>
                  <TableHead className="w-40 text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateFields.length ? (
                  rateFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Input
                          placeholder="Surcharge label"
                          {...register(
                            `${lanePath}.manualRates.${index}.label`
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          className="text-right tabular-nums"
                          {...register(
                            `${lanePath}.manualRates.${index}.amount`,
                            {
                              valueAsNumber: true,
                            }
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove charge"
                          onClick={() => onRemoveRate(index)}
                        >
                          <TrashIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-16 text-center text-muted-foreground"
                    >
                      No charges yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAppendRate()}
          >
            <PlusIcon data-icon="inline-start" />
            Add charge
          </Button>

          <div className="ml-auto flex w-full max-w-sm flex-col gap-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">
                {formatMoney(totals.subtotal, currencyCode)}
              </span>
            </div>

            <div className="flex items-end justify-between gap-3">
              <Field className="flex-1">
                <FieldLabel>Markup</FieldLabel>
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`${lanePath}.markupType`}
                    render={({ field }) => (
                      <ToggleGroup
                        value={[field.value]}
                        onValueChange={(value) => {
                          const next = value[0]
                          if (next === "amount" || next === "percent") {
                            field.onChange(next)
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <ToggleGroupItem value="amount">$</ToggleGroupItem>
                        <ToggleGroupItem value="percent">%</ToggleGroupItem>
                      </ToggleGroup>
                    )}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    className="w-28 text-right tabular-nums"
                    {...register(`${lanePath}.markupValue`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </Field>
              <span className="pb-2 text-xs tabular-nums">
                {formatMoney(totals.markup, currencyCode)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-3 text-sm font-medium">
              <span>Total</span>
              <span className="tabular-nums">
                {formatMoney(totals.total, currencyCode)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
