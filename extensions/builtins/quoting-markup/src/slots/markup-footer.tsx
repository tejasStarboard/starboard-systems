"use client"

import { Controller, useWatch } from "react-hook-form"

import {
  resolveSelectedManualRate,
  type MarkupType,
} from "@starboard/lib-contracts"
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

function MarkupDial({
  markupType,
  markupValue,
  onTypeChange,
  onValueChange,
  label,
}: {
  markupType: MarkupType
  markupValue: number
  onTypeChange: (next: MarkupType) => void
  onValueChange: (next: number) => void
  label?: string
}) {
  return (
    <Field className="flex-1">
      <FieldLabel>{label ?? "Markup"}</FieldLabel>
      <div className="flex items-center gap-2">
        <ToggleGroup
          value={[markupType]}
          onValueChange={(value) => {
            const next = value[0]
            if (next === "amount" || next === "percent") {
              onTypeChange(next)
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="amount">$</ToggleGroupItem>
          <ToggleGroupItem value="percent">%</ToggleGroupItem>
        </ToggleGroup>
        <Input
          type="number"
          step="0.01"
          className="w-28 text-right tabular-nums"
          value={Number.isFinite(markupValue) ? markupValue : 0}
          onChange={(event) => {
            const next = Number(event.target.value)
            onValueChange(Number.isFinite(next) ? next : 0)
          }}
        />
      </div>
    </Field>
  )
}

/**
 * `quoting.markup.footer` → `quoting.slots.totals`.
 * Multi-CT FCL: one dial per container type (starboard-2 RateSummaryRow /
 * SB-5766). Single / flat: lane dial.
 */
export function MarkupFooter({
  control,
  register,
  setValue,
  lanePath,
  currencyCode,
  totals,
}: SlotComponentProps<TotalsSlotProps>) {
  const rates = useWatch({ control, name: `${lanePath}.manualRates` }) ?? []
  const selectedRateId =
    useWatch({ control, name: `${lanePath}.selectedRateId` }) ?? ""
  const containers = useWatch({ control, name: `${lanePath}.containers` }) ?? []
  const laneMarkupType =
    useWatch({ control, name: `${lanePath}.markupType` }) ?? "amount"
  const laneMarkupValue =
    useWatch({ control, name: `${lanePath}.markupValue` }) ?? 0

  const selected = resolveSelectedManualRate(rates, selectedRateId)
  const selectedIndex = selected
    ? rates.findIndex((rate) => rate.id === selected.id)
    : -1
  const multiCt =
    selectedIndex >= 0 &&
    selected?.baseMode === "per_eq" &&
    containers.length > 1

  function upsertEquipmentDial(
    containerType: string,
    patch: { markupType?: MarkupType; markupValue?: number }
  ) {
    if (selectedIndex < 0) {
      return
    }
    const equipment = rates[selectedIndex]?.equipmentAmounts ?? []
    const existing = equipment.find(
      (row) => row.containerType === containerType
    )
    const next = equipment.filter((row) => row.containerType !== containerType)
    next.push({
      containerType,
      amount: existing?.amount ?? 0,
      markupType: patch.markupType ?? existing?.markupType ?? laneMarkupType,
      markupValue:
        patch.markupValue ??
        existing?.markupValue ??
        (Number.isFinite(laneMarkupValue) ? laneMarkupValue : 0),
    })
    setValue(
      `${lanePath}.manualRates.${selectedIndex}.equipmentAmounts`,
      next,
      {
        shouldDirty: true,
      }
    )
  }

  return (
    <div className="ml-auto flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="tabular-nums">
          {formatMoney(totals.subtotal, currencyCode)}
        </span>
      </div>

      {multiCt ? (
        <div className="space-y-3">
          {containers.map((container, index) => {
            const equipment = rates[selectedIndex]?.equipmentAmounts ?? []
            const row = equipment.find(
              (entry) => entry.containerType === container.containerType
            )
            const type =
              row?.markupType === "amount" || row?.markupType === "percent"
                ? row.markupType
                : laneMarkupType
            const value =
              row?.markupValue != null && Number.isFinite(row.markupValue)
                ? row.markupValue
                : Number.isFinite(laneMarkupValue)
                  ? laneMarkupValue
                  : 0
            return (
              <div
                key={container.id || `${container.containerType}-${index}`}
                className="flex items-end justify-between gap-3"
              >
                <MarkupDial
                  label={`Markup · ${container.containerType || "Eq"}`}
                  markupType={type}
                  markupValue={value}
                  onTypeChange={(next) =>
                    upsertEquipmentDial(container.containerType, {
                      markupType: next,
                    })
                  }
                  onValueChange={(next) =>
                    upsertEquipmentDial(container.containerType, {
                      markupValue: next,
                    })
                  }
                />
              </div>
            )
          })}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Markup total</span>
            <span className="tabular-nums">
              {formatMoney(totals.markup, currencyCode)}
            </span>
          </div>
        </div>
      ) : (
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
      )}

      <div className="flex items-center justify-between gap-3 border-t pt-3 text-sm font-medium">
        <span>Total</span>
        <span className="tabular-nums">
          {formatMoney(totals.total, currencyCode)}
        </span>
      </div>
    </div>
  )
}
