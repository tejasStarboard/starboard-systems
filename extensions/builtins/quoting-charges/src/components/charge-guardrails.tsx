"use client"

import { Controller, type Control, type UseFormRegister } from "react-hook-form"

import type { QuoteFormValues, ScopeOverride } from "@starboard/lib-contracts"
import { Checkbox } from "@starboard/lib-ui/components/checkbox"
import { Input } from "@starboard/lib-ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"

type SurchargePrefix =
  | `lanes.${number}.manualRates.${number}.surcharges.${number}`
  | `globalCharges.${number}`

function nullableNumber(value: unknown): number | null {
  if (value === "" || value == null) {
    return null
  }
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

export function ChargeGuardrails({
  control,
  register,
  prefix,
  showScope,
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  prefix: SurchargePrefix
  showScope: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        step="0.01"
        placeholder="Free"
        title="Free usage"
        className="h-8 w-20 text-right tabular-nums"
        {...register(`${prefix}.freeUsage`, { setValueAs: nullableNumber })}
      />
      <Input
        type="number"
        step="0.01"
        placeholder="Min"
        title="Minimum usage"
        className="h-8 w-20 text-right tabular-nums"
        {...register(`${prefix}.minUsage`, { setValueAs: nullableNumber })}
      />
      <Input
        type="number"
        step="0.01"
        placeholder="Max"
        title="Maximum usage"
        className="h-8 w-20 text-right tabular-nums"
        {...register(`${prefix}.maxUsage`, { setValueAs: nullableNumber })}
      />
      <Input
        type="number"
        step="0.01"
        placeholder="Sell"
        title="Line sell. Blank mirrors the calculated buy."
        className="h-8 w-24 text-right tabular-nums"
        {...register(`${prefix}.sellAmount`, { setValueAs: nullableNumber })}
      />
      <Controller
        control={control}
        name={`${prefix}.isVisible`}
        render={({ field }) => (
          <span className="flex items-center gap-2">
            <label
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              title="Split shows this line on its own. Unchecked absorbs it into the total."
            >
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              Split
            </label>
            {field.value ? null : (
              <span className="text-[11px] text-muted-foreground">
                Absorbed
              </span>
            )}
          </span>
        )}
      />
      {showScope ? (
        <Controller
          control={control}
          name={`${prefix}.scopeOverride`}
          render={({ field }) => (
            <Select
              value={field.value ?? "auto"}
              onValueChange={(value) => {
                const next: ScopeOverride | null =
                  value === "include" || value === "exclude" ? value : null
                field.onChange(next)
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-28"
                title="Force include or exclude against the Incoterm bucket"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="include">Include</SelectItem>
                <SelectItem value="exclude">Exclude</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      ) : null}
    </div>
  )
}
