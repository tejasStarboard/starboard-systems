"use client"

import {
  Controller,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@starboard/lib-ui/components/collapsible"
import { Field, FieldLabel } from "@starboard/lib-ui/components/field"

import { AddressCombobox, PortCombobox } from "@starboard/ext-geo-gazetteer"
import type { QuoteFormOption, QuoteFormValues } from "../lib/quotes.schema"
import { QuoteSlot, useQuoteSlotEntries } from "../slots/slot-host"
import {
  QUOTING_SLOTS,
  type LaneRouteField,
  type LaneRouteSlotProps,
} from "../slots/types"
import { RouteBoundary } from "./route-boundary"

type PortFieldsProps = {
  control: Control<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
  laneIndex: number
  portOptions: QuoteFormOption[]
}

const fieldId = (laneIndex: number, name: string) => `lane-${laneIndex}-${name}`

/** Classic route fields (LCL / Air, and the FCL fallback): pickup, ports, vias, delivery. */
function ClassicPortFields({
  control,
  laneIndex,
  portOptions,
  mode,
}: Omit<PortFieldsProps, "setValue"> & { mode: string }) {
  const prefix = `lanes.${laneIndex}` as const
  const originLabel = mode === "air" ? "Origin airport" : "Origin port"
  const destinationLabel =
    mode === "air" ? "Destination airport" : "Destination port"
  const codePlaceholder = mode === "air" ? "IATA / UNLOCODE" : "UNLOCODE"
  const id = (name: string) => fieldId(laneIndex, name)

  const port = (
    name: "origin" | "destination" | "originVia" | "destinationVia",
    label: string,
    placeholder: string
  ) => (
    <Controller
      control={control}
      name={`${prefix}.${name}`}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={id(name)}>{label}</FieldLabel>
          <PortCombobox
            id={id(name)}
            options={portOptions}
            value={field.value}
            onChange={field.onChange}
            placeholder={placeholder}
          />
        </Field>
      )}
    />
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DoorField control={control} laneIndex={laneIndex} name="pickup" />
      {port("origin", originLabel, codePlaceholder)}
      {mode === "fcl" ? (
        <>
          {port("originVia", "Origin via", "Optional via port")}
          {port("destinationVia", "Destination via", "Optional via port")}
        </>
      ) : null}
      {port("destination", destinationLabel, codePlaceholder)}
      <DoorField control={control} laneIndex={laneIndex} name="delivery" />
    </div>
  )
}

function DoorField({
  control,
  laneIndex,
  name,
}: {
  control: Control<QuoteFormValues>
  laneIndex: number
  name: "pickup" | "delivery"
}) {
  const id = fieldId(laneIndex, name)
  return (
    <Controller
      control={control}
      name={`lanes.${laneIndex}.${name}`}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={id}>
            {name === "pickup" ? "Pickup" : "Delivery"}
          </FieldLabel>
          <AddressCombobox
            id={id}
            value={field.value}
            onChange={field.onChange}
            placeholder={`Search ${name} address…`}
          />
        </Field>
      )}
    />
  )
}

/** Door pickup / delivery, collapsed unless one is already set. */
function DoorMoves({
  control,
  laneIndex,
}: Pick<PortFieldsProps, "control" | "laneIndex">) {
  const pickup = useWatch({ control, name: `lanes.${laneIndex}.pickup` })
  const delivery = useWatch({ control, name: `lanes.${laneIndex}.delivery` })
  return (
    <Collapsible defaultOpen={Boolean(pickup || delivery)}>
      <CollapsibleTrigger
        render={<Button type="button" variant="ghost" size="sm" />}
      >
        Door moves (pickup / delivery)
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-4 pt-3 sm:grid-cols-2">
          <DoorField control={control} laneIndex={laneIndex} name="pickup" />
          <DoorField control={control} laneIndex={laneIndex} name="delivery" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Route ports for one lane. FCL mounts the `quoting.slots.laneRoute`
 * contribution (world map) when one is active; LCL / Air, an unplugged
 * contribution, or a contribution that throws all render `PortCombobox`.
 */
export function LaneRoutePorts({
  control,
  setValue,
  laneIndex,
  portOptions,
  mode,
}: PortFieldsProps & { mode: string }) {
  const prefix = `lanes.${laneIndex}` as const
  const entries = useQuoteSlotEntries(QUOTING_SLOTS.laneRoute)
  const origin = useWatch({ control, name: `${prefix}.origin` })
  const destination = useWatch({ control, name: `${prefix}.destination` })
  const originVia = useWatch({ control, name: `${prefix}.originVia` })
  const destinationVia = useWatch({ control, name: `${prefix}.destinationVia` })

  const classic = (
    <ClassicPortFields
      control={control}
      laneIndex={laneIndex}
      portOptions={portOptions}
      mode={mode}
    />
  )
  if (mode !== "fcl" || entries.length === 0) return classic

  const slotProps: LaneRouteSlotProps = {
    origin: origin ?? "",
    destination: destination ?? "",
    originVia: originVia ?? "",
    destinationVia: destinationVia ?? "",
    portOptions,
    idPrefix: `lane-${laneIndex}`,
    onChange: (field: LaneRouteField, value: string) =>
      setValue(`${prefix}.${field}`, value, {
        shouldDirty: true,
        shouldTouch: true,
      }),
  }

  return (
    <RouteBoundary fallback={classic}>
      <div className="flex flex-col gap-4">
        <QuoteSlot point={QUOTING_SLOTS.laneRoute} props={slotProps} />
        <DoorMoves control={control} laneIndex={laneIndex} />
      </div>
    </RouteBoundary>
  )
}
