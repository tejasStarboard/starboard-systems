"use client"

import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@starboard/lib-ui/components/table"

import {
  createContainerLine,
  type QuoteFormOption,
  type QuoteFormValues,
} from "../lib/quotes.schema"

/** Step 3 (Cargo): FCL container table or LCL / Air weight, volume, pallets. */
export function LaneCargoFields({
  control,
  register,
  laneIndex,
  containerTypeOptions,
  palletTypeOptions,
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
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
  const fieldId = (name: string) => `lane-${laneIndex}-${name}`

  return (
    <FieldGroup className="gap-4">
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
