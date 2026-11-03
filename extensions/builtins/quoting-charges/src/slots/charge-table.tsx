"use client"

import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useWatch } from "react-hook-form"

import {
  resolveSelectedManualRate,
  type RateBaseMode,
} from "@starboard/lib-contracts"
import type {
  ChargeTableSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"
import { Button } from "@starboard/lib-ui/components/button"
import { Input } from "@starboard/lib-ui/components/input"

import { GlobalChargesEditor } from "../components/global-charges-editor"
import { RateSurchargesEditor } from "../components/rate-surcharges-editor"

/**
 * `quoting.charges.table` → `quoting.slots.chargeTable`.
 * One grid for the selected rate alternative. Add charge appends a line.
 */
export function ChargeTable({
  control,
  register,
  setValue,
  lanePath,
  currencyCode,
  excludedBuckets,
  onAppendRate,
  onRemoveRate,
}: SlotComponentProps<ChargeTableSlotProps>) {
  const rates = useWatch({ control, name: `${lanePath}.manualRates` }) ?? []
  const selectedRateId =
    useWatch({ control, name: `${lanePath}.selectedRateId` }) ?? ""
  const containers = useWatch({ control, name: `${lanePath}.containers` }) ?? []
  const selected = resolveSelectedManualRate(rates, selectedRateId)
  const selectedIndex = selected
    ? rates.findIndex((rate) => rate.id === selected.id)
    : -1

  function selectRate(id: string) {
    setValue(`${lanePath}.selectedRateId`, id, { shouldDirty: true })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Charges</h3>
        <p className="text-xs text-muted-foreground">
          Rates are alternatives. Totals use the selected rate only.
        </p>
      </div>

      {rates.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {rates.map((rate) => {
            const active = rate.id === selected?.id
            return (
              <Button
                key={rate.id}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => selectRate(rate.id)}
              >
                {rate.label.trim() || "Rate"}
              </Button>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No rates yet.</p>
      )}

      <div className="space-y-3 rounded-none border p-3">
        {selectedIndex >= 0 ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Base freight
                </span>
                <Input
                  placeholder="Rate label"
                  {...register(
                    `${lanePath}.manualRates.${selectedIndex}.label`
                  )}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Basis</span>
                <select
                  className="h-8 border bg-background px-2 text-xs"
                  value={rates[selectedIndex]?.baseMode ?? "flat"}
                  onChange={(event) => {
                    setValue(
                      `${lanePath}.manualRates.${selectedIndex}.baseMode`,
                      event.target.value as RateBaseMode,
                      { shouldDirty: true }
                    )
                  }}
                >
                  <option value="flat">Flat</option>
                  <option value="per_eq">Per Eq</option>
                </select>
              </label>
              <label className="flex w-36 flex-col gap-1">
                <span className="text-xs text-muted-foreground">Amount</span>
                <Input
                  type="number"
                  step="0.01"
                  className="text-right tabular-nums"
                  {...register(
                    `${lanePath}.manualRates.${selectedIndex}.amount`,
                    { valueAsNumber: true }
                  )}
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove rate"
                onClick={() => onRemoveRate(selectedIndex)}
              >
                <TrashIcon />
              </Button>
            </div>

            {rates[selectedIndex]?.baseMode === "per_eq" &&
            containers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Equipment amounts. Empty rows use the amount above times
                  container count.
                </p>
                {containers.map((container, containerIndex) => {
                  const equipment = rates[selectedIndex]?.equipmentAmounts ?? []
                  const current = equipment.find(
                    (row) => row.containerType === container.containerType
                  )
                  return (
                    <label
                      key={container.id || containerIndex}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-24 font-mono">
                        {container.containerType || "Eq"} × {container.count}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-32 text-right tabular-nums"
                        value={current?.amount ?? ""}
                        onChange={(event) => {
                          const amount = Number(event.target.value)
                          const next = equipment.filter(
                            (row) =>
                              row.containerType !== container.containerType
                          )
                          if (
                            event.target.value !== "" &&
                            Number.isFinite(amount)
                          ) {
                            next.push({
                              containerType: container.containerType,
                              amount,
                              markupType: current?.markupType ?? null,
                              markupValue: current?.markupValue ?? null,
                            })
                          }
                          setValue(
                            `${lanePath}.manualRates.${selectedIndex}.equipmentAmounts`,
                            next,
                            { shouldDirty: true }
                          )
                        }}
                      />
                    </label>
                  )
                })}
              </div>
            ) : null}

            <RateSurchargesEditor
              control={control}
              register={register}
              setValue={setValue}
              lanePath={lanePath}
              rateIndex={selectedIndex}
              currencyCode={currencyCode}
              excludedBuckets={excludedBuckets}
            />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select or add a rate to edit base freight and leg surcharges.
          </p>
        )}

        {/* Quote-level globals: same grid as O/F/D (071), not a sibling panel. */}
        <GlobalChargesEditor
          control={control}
          register={register}
          setValue={setValue}
          currencyCode={currencyCode}
        />
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onAppendRate}>
        <PlusIcon data-icon="inline-start" />
        Add rate
      </Button>
    </div>
  )
}
