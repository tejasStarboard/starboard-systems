"use client"

import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form"

import {
  createSurchargeLine,
  type SurchargeLeg,
  type UsageUnit,
} from "@starboard/lib-contracts"
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
import { cn } from "@starboard/lib-ui/lib/utils"

import type { QuoteFormValues } from "@/lib/domain/quotes/quotes.schema"

const LEGS: { value: SurchargeLeg; label: string }[] = [
  { value: "origin", label: "Origin" },
  { value: "freight", label: "Freight" },
  { value: "destination", label: "Destination" },
]

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

export function RateSurchargesEditor({
  control,
  register,
  lanePath,
  rateIndex,
  currencyCode,
  excludedBuckets = [],
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  lanePath: `lanes.${number}`
  rateIndex: number
  currencyCode: string
  excludedBuckets?: Array<"origin" | "freight" | "destination">
}) {
  const surchargesPath =
    `${lanePath}.manualRates.${rateIndex}.surcharges` as const

  const { fields, append, remove } = useFieldArray({
    control,
    name: surchargesPath,
  })

  const watched =
    useWatch({
      control,
      name: surchargesPath,
    }) ?? []

  const byLeg = LEGS.map((leg) => ({
    ...leg,
    items: fields
      .map((field, index) => ({
        field,
        index,
        leg: (watched[index]?.leg ?? field.leg) as SurchargeLeg,
        usageUnit: (watched[index]?.usageUnit ?? field.usageUnit) as UsageUnit,
      }))
      .filter((item) => item.leg === leg.value),
  }))

  return (
    <div className="space-y-3 border-t border-dashed bg-muted/20 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Surcharges</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            append(
              createSurchargeLine({
                currencyCode: currencyCode || "USD",
                source: "manual",
              })
            )
          }
        >
          <PlusIcon data-icon="inline-start" />
          Add surcharge
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">No surcharge lines.</p>
      ) : (
        byLeg.map((group) =>
          group.items.length === 0 ? null : (
            <div key={group.value} className="space-y-2">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map(({ field, index, usageUnit, leg }) => {
                  const prefix = `${surchargesPath}.${index}` as const
                  const isPercentage = usageUnit === "percentage"
                  const scopedOut = excludedBuckets.includes(leg)
                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "grid grid-cols-[minmax(0,1.4fr)_7rem_7rem_6rem_auto_auto] items-center gap-2",
                        scopedOut && "opacity-50"
                      )}
                      title={
                        scopedOut
                          ? `${leg} charges excluded without a door at that end`
                          : undefined
                      }
                    >
                      <Input
                        placeholder="Name"
                        className="h-8"
                        {...register(`${prefix}.name`)}
                      />
                      <Controller
                        control={control}
                        name={`${prefix}.leg`}
                        render={({ field: legField }) => (
                          <Select
                            value={legField.value}
                            onValueChange={(value) => {
                              if (
                                value === "origin" ||
                                value === "freight" ||
                                value === "destination"
                              ) {
                                legField.onChange(value)
                              }
                            }}
                          >
                            <SelectTrigger size="sm" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEGS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
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
                              value === "" || value == null
                                ? null
                                : Number(value),
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
                              value === "" || value == null
                                ? null
                                : Number(value),
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
                        aria-label="Remove surcharge"
                        onClick={() => remove(index)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )
      )}
    </div>
  )
}
