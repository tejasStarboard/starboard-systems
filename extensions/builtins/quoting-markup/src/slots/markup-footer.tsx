"use client"

import { Controller } from "react-hook-form"

import type {
  SlotComponentProps,
  TotalsSlotProps,
} from "@starboard/ext-quoting-document/slots"
import { Field, FieldLabel } from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@starboard/lib-ui/components/toggle-group"

function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return value.toFixed(2)
  }
}

/**
 * `quoting.markup.footer` → `quoting.slots.totals`.
 * Subtotal, lane markup dial ($ / %), and total — same QV2 footer as before.
 */
export function MarkupFooter({
  control,
  register,
  lanePath,
  currencyCode,
  totals,
}: SlotComponentProps<TotalsSlotProps>) {
  return (
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
  )
}
