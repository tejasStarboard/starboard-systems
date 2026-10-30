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

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import {
  createContainerLine,
  type LaneMode,
  type QuoteFormOption,
  type QuoteFormValues,
} from "@/lib/quotes/schema"

export function LaneFields({
  control,
  register,
  setValue,
  laneIndex,
  containerTypeOptions,
  palletTypeOptions,
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
  laneIndex: number
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
}) {
  const prefix = `lanes.${laneIndex}` as const
  const mode = useWatch({ control, name: `${prefix}.mode` })
  const {
    fields: containers,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `${prefix}.containers`,
  })

  function switchMode(next: LaneMode) {
    setValue(`${prefix}.mode`, next, { shouldDirty: true })
    if (next === "fcl") {
      setValue(`${prefix}.weight`, 0, { shouldDirty: true })
      setValue(`${prefix}.volume`, 0, { shouldDirty: true })
      setValue(`${prefix}.palletCount`, 0, { shouldDirty: true })
      setValue(`${prefix}.palletType`, "", { shouldDirty: true })
      if (containers.length === 0) {
        append(
          createContainerLine({
            containerType: containerTypeOptions[0]?.value ?? "",
          })
        )
      }
    } else {
      setValue(`${prefix}.originVia`, "", { shouldDirty: true })
      setValue(`${prefix}.destinationVia`, "", { shouldDirty: true })
      setValue(`${prefix}.containers`, [], { shouldDirty: true })
      if (!palletTypeOptions.some((option) => option.value === "EUROPEAN")) {
        setValue(
          `${prefix}.palletType`,
          palletTypeOptions[0]?.value ?? "",
          { shouldDirty: true }
        )
      } else {
        setValue(`${prefix}.palletType`, "EUROPEAN", { shouldDirty: true })
      }
    }
  }

  const originLabel = mode === "air" ? "Origin airport" : "Origin port"
  const destinationLabel =
    mode === "air" ? "Destination airport" : "Destination port"
  const codePlaceholder = mode === "air" ? "IATA / UNLOCODE" : "UNLOCODE"
  const fieldId = (name: string) => `lane-${laneIndex}-${name}`

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={fieldId("pickup")}>Pickup</FieldLabel>
          <Input
            id={fieldId("pickup")}
            placeholder="Door / warehouse"
            {...register(`${prefix}.pickup`)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={fieldId("origin")}>{originLabel}</FieldLabel>
          <Input
            id={fieldId("origin")}
            placeholder={codePlaceholder}
            {...register(`${prefix}.origin`)}
          />
        </Field>
        {mode === "fcl" ? (
          <>
            <Field>
              <FieldLabel htmlFor={fieldId("originVia")}>Origin via</FieldLabel>
              <Input
                id={fieldId("originVia")}
                placeholder="Optional via port"
                {...register(`${prefix}.originVia`)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={fieldId("destinationVia")}>
                Destination via
              </FieldLabel>
              <Input
                id={fieldId("destinationVia")}
                placeholder="Optional via port"
                {...register(`${prefix}.destinationVia`)}
              />
            </Field>
          </>
        ) : null}
        <Field>
          <FieldLabel htmlFor={fieldId("destination")}>
            {destinationLabel}
          </FieldLabel>
          <Input
            id={fieldId("destination")}
            placeholder={codePlaceholder}
            {...register(`${prefix}.destination`)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={fieldId("delivery")}>Delivery</FieldLabel>
          <Input
            id={fieldId("delivery")}
            placeholder="Door / warehouse"
            {...register(`${prefix}.delivery`)}
          />
        </Field>
      </div>

      {mode === "fcl" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <FieldLabel>Containers</FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                append(
                  createContainerLine({
                    containerType: containerTypeOptions[0]?.value ?? "",
                  })
                )
              }
            >
              <PlusIcon data-icon="inline-start" />
              Add container
            </Button>
          </div>
          <div className="overflow-x-auto rounded-none border">
            <Table className="min-w-[20rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-28">Count</TableHead>
                  <TableHead className="w-32">Weight</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((container, index) => (
                  <TableRow key={container.id}>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`${prefix}.containers.${index}.containerType`}
                        render={({ field }) => (
                          <Select
                            value={field.value || null}
                            onValueChange={(value) => {
                              field.onChange(value ?? "")
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {containerTypeOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="tabular-nums"
                        {...register(`${prefix}.containers.${index}.count`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="tabular-nums"
                        {...register(`${prefix}.containers.${index}.weight`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove container"
                        disabled={containers.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <TrashIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {mode === "lcl" || mode === "air" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Controller
            control={control}
            name={`${prefix}.palletType`}
            render={({ field }) => (
              <Field>
                <FieldLabel>Pallet type</FieldLabel>
                <Select
                  value={field.value || null}
                  onValueChange={(value) => {
                    field.onChange(value ?? "")
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select pallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {palletTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Field>
            <FieldLabel htmlFor={fieldId("weight")}>Weight</FieldLabel>
            <Input
              id={fieldId("weight")}
              type="number"
              min={0}
              step="0.01"
              className="tabular-nums"
              {...register(`${prefix}.weight`, { valueAsNumber: true })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={fieldId("volume")}>Volume</FieldLabel>
            <Input
              id={fieldId("volume")}
              type="number"
              min={0}
              step="0.01"
              className="tabular-nums"
              {...register(`${prefix}.volume`, { valueAsNumber: true })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={fieldId("palletCount")}>
              Pallet count
            </FieldLabel>
            <Input
              id={fieldId("palletCount")}
              type="number"
              min={0}
              className="tabular-nums"
              {...register(`${prefix}.palletCount`, {
                valueAsNumber: true,
              })}
            />
          </Field>
        </div>
      ) : null}
    </FieldGroup>
  )
}
