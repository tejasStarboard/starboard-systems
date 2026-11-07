"use client"

import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form"

import {
  createSurchargeLine,
  type QuoteFormValues,
  type SurchargeLeg,
  type UsageUnit,
} from "@starboard/lib-contracts"
import { CurrencyCombobox } from "@starboard/ext-geo-gazetteer"
import { Button } from "@starboard/lib-ui/components/button"
import { Checkbox } from "@starboard/lib-ui/components/checkbox"
import { Input } from "@starboard/lib-ui/components/input"
import { Label } from "@starboard/lib-ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"
import { cn } from "@starboard/lib-ui/lib/utils"

import { equipmentLabel } from "../lib/equipment-label"
import { ChargeGuardrails } from "./charge-guardrails"
import { RowFxHint } from "./row-fx-hint"
import { USAGE_UNIT_LABELS } from "./usage-labels"

const LEGS: { value: SurchargeLeg; label: string }[] = [
  { value: "origin", label: "Origin" },
  { value: "freight", label: "Freight" },
  { value: "destination", label: "Destination" },
]

const USAGE_UNITS = USAGE_UNIT_LABELS
const DEFAULT_EQ = "__default__"

export function RateSurchargesEditor({
  control,
  register,
  setValue,
  lanePath,
  rateIndex,
  currencyCode,
  excludedBuckets = [],
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
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
  const containers =
    useWatch({
      control,
      name: `${lanePath}.containers`,
    }) ?? []
  const exchangeRates = useWatch({ control, name: "exchangeRates" }) ?? {}
  // Blank base stays blank (same as totals' `currencyCode || null`): no
  // invented USD for new lines or FX hints.
  const quoteCurrency = currencyCode.trim().toUpperCase()

  const equipmentOptions = [
    { value: DEFAULT_EQ, label: "Default" },
    ...containers
      .map((container) => container.containerType.trim())
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .map((value) => ({ value, label: equipmentLabel(value) })),
  ]

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

  function setFxRate(from: string, to: string, rate: number) {
    const next = {
      ...exchangeRates,
      [from]: {
        ...(exchangeRates[from] ?? {}),
        [to]: rate,
      },
    }
    setValue("exchangeRates", next, { shouldDirty: true })
  }

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
                currencyCode: quoteCurrency,
                source: "manual",
              })
            )
          }
        >
          <PlusIcon data-icon="inline-start" />
          Add charge
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
                  const scopeOverride = watched[index]?.scopeOverride ?? null
                  const forcedOut = scopeOverride === "exclude"
                  const forcedIn = scopeOverride === "include"
                  const scopedOut =
                    forcedOut || (!forcedIn && excludedBuckets.includes(leg))
                  const showScope =
                    excludedBuckets.length > 0 || scopeOverride != null
                  const lineCurrency =
                    watched[index]?.currencyCode ?? quoteCurrency
                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "space-y-1.5 border px-2 py-2",
                        scopedOut && "opacity-50"
                      )}
                      title={scopedOut ? "Excluded by Incoterm" : undefined}
                    >
                      <div className="grid grid-cols-[minmax(0,1.2fr)_6rem_6rem_8rem_4.5rem_5rem_auto_auto] items-center gap-2">
                        <Input
                          placeholder="Name"
                          className="h-8"
                          {...register(`${prefix}.name`)}
                        />
                        <Controller
                          control={control}
                          name={`${prefix}.equipmentType`}
                          render={({ field: eqField }) => (
                            <Select
                              value={eqField.value?.trim() || DEFAULT_EQ}
                              onValueChange={(value) => {
                                eqField.onChange(
                                  value === DEFAULT_EQ ? null : value
                                )
                              }}
                            >
                              <SelectTrigger size="sm" className="w-full">
                                <SelectValue placeholder="Eq" />
                              </SelectTrigger>
                              <SelectContent>
                                {equipmentOptions.map((option) => (
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
                                  <SelectItem
                                    key={unit.value}
                                    value={unit.value}
                                  >
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
                            placeholder="Buy"
                            title="Buy rate"
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
                          name={`${prefix}.currencyCode`}
                          render={({ field: ccyField }) => (
                            <CurrencyCombobox
                              value={ccyField.value ?? ""}
                              onChange={ccyField.onChange}
                              placeholder="CCY"
                              className="h-8"
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name={`${prefix}.isIncludedInTotal`}
                          render={({ field: includeField }) => (
                            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Checkbox
                                checked={includeField.value}
                                onCheckedChange={(checked) =>
                                  includeField.onChange(checked === true)
                                }
                              />
                              Incl.
                            </Label>
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
                      <RowFxHint
                        lineCurrency={lineCurrency}
                        quoteCurrency={quoteCurrency}
                        exchangeRates={exchangeRates}
                        onSetRate={setFxRate}
                      />
                      <ChargeGuardrails
                        control={control}
                        register={register}
                        prefix={prefix}
                        showScope={showScope}
                      />
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
