"use client"

import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form"

import { createSurchargeLine, type UsageUnit } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import { Checkbox } from "@starboard/lib-ui/components/checkbox"
import { Input } from "@starboard/lib-ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"

import type { QuoteFormValues } from "@/lib/domain/quotes/quotes.schema"

const USAGE_UNITS: { value: UsageUnit; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "container", label: "Container" },
  { value: "teu", label: "TEU" },
  { value: "cbm", label: "CBM" },
  { value: "kg", label: "Kg" },
  { value: "ton", label: "Ton" },
  { value: "wm", label: "W/M" },
  { value: "pallet", label: "Pallet" },
  { value: "per_time", label: "Per time" },
  { value: "percentage", label: "% freight" },
  { value: "unknown", label: "Unknown" },
]

export function GlobalChargesEditor({
  control,
  register,
  currencyCode,
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  currencyCode: string
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "globalCharges",
  })

  const watched =
    useWatch({
      control,
      name: "globalCharges",
    }) ?? []

  return (
    <div className="space-y-3 rounded-none border border-dashed bg-muted/10 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Global charges
          </p>
          <p className="text-[11px] text-muted-foreground">
            Quote-level; not dropped by door / bucket scope.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            append(
              createSurchargeLine({
                currencyCode: currencyCode || "USD",
                source: "global",
                leg: "freight",
              })
            )
          }
        >
          <PlusIcon data-icon="inline-start" />
          Add global
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">No global charges.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const prefix = `globalCharges.${index}` as const
            const usageUnit = (watched[index]?.usageUnit ??
              field.usageUnit) as UsageUnit
            const isPercentage = usageUnit === "percentage"
            return (
              <div
                key={field.id}
                className="grid grid-cols-[minmax(0,1.4fr)_7rem_7rem_auto_auto] items-center gap-2"
              >
                <Input
                  placeholder="Name"
                  className="h-8"
                  {...register(`${prefix}.name`)}
                />
                <Controller
                  control={control}
                  name={`${prefix}.usageUnit`}
                  render={({ field: unitField }) => (
                    <Select
                      value={unitField.value}
                      onValueChange={(value) => {
                        if (value) {
                          unitField.onChange(value as UsageUnit)
                        }
                      }}
                    >
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USAGE_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {isPercentage ? (
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="%"
                    className="h-8 text-right tabular-nums"
                    {...register(`${prefix}.ratePercentage`, {
                      setValueAs: (value) =>
                        value === "" || value == null ? null : Number(value),
                    })}
                  />
                ) : (
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    className="h-8 text-right tabular-nums"
                    {...register(`${prefix}.rate`, {
                      setValueAs: (value) =>
                        value === "" || value == null ? null : Number(value),
                    })}
                  />
                )}
                <Controller
                  control={control}
                  name={`${prefix}.isIncludedInTotal`}
                  render={({ field: includeField }) => (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={includeField.value}
                        onCheckedChange={(checked) =>
                          includeField.onChange(checked === true)
                        }
                      />
                      Incl.
                    </label>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove global charge"
                  onClick={() => remove(index)}
                >
                  <TrashIcon />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
