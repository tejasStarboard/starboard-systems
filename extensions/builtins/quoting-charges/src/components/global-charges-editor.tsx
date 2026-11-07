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

import { ChargeGuardrails } from "./charge-guardrails"
import { RowFxHint } from "./row-fx-hint"
import { USAGE_UNIT_LABELS } from "./usage-labels"

const USAGE_UNITS = USAGE_UNIT_LABELS

export function GlobalChargesEditor({
  control,
  register,
  setValue,
  currencyCode,
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
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
  const exchangeRates = useWatch({ control, name: "exchangeRates" }) ?? {}
  // Blank base stays blank (same as totals' `currencyCode || null`): no
  // invented USD for new lines or FX hints.
  const quoteCurrency = currencyCode.trim().toUpperCase()

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
    <div className="space-y-2 border-t border-dashed pt-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Global
          </p>
          <p className="text-[11px] text-muted-foreground">
            Quote-level; not dropped by Incoterm / door scope.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            append(
              createSurchargeLine({
                currencyCode: quoteCurrency,
                source: "global",
                leg: "freight",
              })
            )
          }
        >
          <PlusIcon data-icon="inline-start" />
          Add charge
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">No global lines.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const prefix = `globalCharges.${index}` as const
            const usageUnit = (watched[index]?.usageUnit ??
              field.usageUnit) as UsageUnit
            const isPercentage = usageUnit === "percentage"
            const lineCurrency = watched[index]?.currencyCode ?? quoteCurrency
            return (
              <div key={field.id} className="space-y-1.5 border px-2 py-2">
                <div className="grid grid-cols-[minmax(0,1.4fr)_7rem_7rem_8rem_auto_auto] items-center gap-2">
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
                      placeholder="Buy"
                      title="Buy rate"
                      className="h-8 text-right tabular-nums"
                      {...register(`${prefix}.rate`, {
                        setValueAs: (value) =>
                          value === "" || value == null ? null : Number(value),
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
                    aria-label="Remove global charge"
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
                  showScope={false}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
