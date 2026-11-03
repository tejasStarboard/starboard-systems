"use client"

import {
  Controller,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form"

import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@starboard/lib-ui/components/toggle-group"

import {
  createContainerLine,
  type LaneMode,
  type QuoteFormOption,
  type QuoteFormValues,
} from "../lib/quotes.schema"
import { LaneRoutePorts } from "./lane-route-ports"

/** Step 2 (Route): mode, ports, vias and door addresses for one lane. */
export function LaneRouteFields({
  control,
  setValue,
  laneIndex,
  portOptions,
  containerTypeOptions,
  palletTypeOptions,
}: {
  control: Control<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
  laneIndex: number
  portOptions: QuoteFormOption[]
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
}) {
  const prefix = `lanes.${laneIndex}` as const
  const mode = useWatch({ control, name: `${prefix}.mode` })
  const containers = useWatch({ control, name: `${prefix}.containers` })

  function switchMode(next: LaneMode) {
    setValue(`${prefix}.mode`, next, { shouldDirty: true })
    if (next === "fcl") {
      setValue(`${prefix}.weight`, 0, { shouldDirty: true })
      setValue(`${prefix}.volume`, 0, { shouldDirty: true })
      setValue(`${prefix}.palletCount`, 0, { shouldDirty: true })
      setValue(`${prefix}.palletType`, "", { shouldDirty: true })
      if ((containers?.length ?? 0) === 0) {
        setValue(
          `${prefix}.containers`,
          [
            createContainerLine({
              containerType: containerTypeOptions[0]?.value ?? "",
            }),
          ],
          { shouldDirty: true }
        )
      }
    } else {
      setValue(`${prefix}.originVia`, "", { shouldDirty: true })
      setValue(`${prefix}.destinationVia`, "", { shouldDirty: true })
      setValue(`${prefix}.containers`, [], { shouldDirty: true })
      if (!palletTypeOptions.some((option) => option.value === "EUROPEAN")) {
        setValue(`${prefix}.palletType`, palletTypeOptions[0]?.value ?? "", {
          shouldDirty: true,
        })
      } else {
        setValue(`${prefix}.palletType`, "EUROPEAN", { shouldDirty: true })
      }
    }
  }

  return (
    <FieldGroup className="gap-4">
      <Controller
        control={control}
        name={`${prefix}.mode`}
        render={({ field }) => (
          <Field>
            <FieldLabel>Mode</FieldLabel>
            <ToggleGroup
              value={[field.value]}
              onValueChange={(value) => {
                const next = value[0]
                if (next === "fcl" || next === "lcl" || next === "air") {
                  field.onChange(next)
                  switchMode(next)
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="fcl">FCL</ToggleGroupItem>
              <ToggleGroupItem value="lcl">LCL</ToggleGroupItem>
              <ToggleGroupItem value="air">Air</ToggleGroupItem>
            </ToggleGroup>
          </Field>
        )}
      />

      <LaneRoutePorts
        control={control}
        setValue={setValue}
        laneIndex={laneIndex}
        portOptions={portOptions}
        mode={mode}
      />
    </FieldGroup>
  )
}
