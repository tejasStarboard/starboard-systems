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
  containerTypeOptions,
  palletTypeOptions,
}: {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
}) {
  const mode = useWatch({ control, name: "lane.mode" })
  const {
    fields: containers,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "lane.containers",
  })

  function switchMode(next: LaneMode) {
    setValue("lane.mode", next, { shouldDirty: true })
    if (next === "fcl") {
      setValue("lane.weight", 0, { shouldDirty: true })
      setValue("lane.volume", 0, { shouldDirty: true })
      setValue("lane.palletCount", 0, { shouldDirty: true })
      setValue("lane.palletType", "", { shouldDirty: true })
      if (containers.length === 0) {
        append(
          createContainerLine({
            containerType: containerTypeOptions[0]?.value ?? "",
          })
        )
      }
    } else {
      setValue("lane.originVia", "", { shouldDirty: true })
      setValue("lane.destinationVia", "", { shouldDirty: true })
      setValue("lane.containers", [], { shouldDirty: true })
      if (!palletTypeOptions.some((option) => option.value === "EUROPEAN")) {
        setValue(
          "lane.palletType",
          palletTypeOptions[0]?.value ?? "",
          { shouldDirty: true }
        )
      } else {
        setValue("lane.palletType", "EUROPEAN", { shouldDirty: true })
      }
    }
  }

  const originLabel = mode === "air" ? "Origin airport" : "Origin port"
  const destinationLabel =
    mode === "air" ? "Destination airport" : "Destination port"
  const codePlaceholder = mode === "air" ? "IATA / UNLOCODE" : "UNLOCODE"

  return (
    <FieldGroup className="gap-4">
      <Controller
        control={control}
        name="lane.mode"
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
          <FieldLabel htmlFor="pickup">Pickup</FieldLabel>
          <Input
            id="pickup"
            placeholder="Door / warehouse"
            {...register("lane.pickup")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="delivery">Delivery</FieldLabel>
          <Input
            id="delivery"
            placeholder="Door / warehouse"
            {...register("lane.delivery")}
          />
        </Field>
      </div>

      {mode === "fcl" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="origin">{originLabel}</FieldLabel>
              <Input
                id="origin"
                placeholder={codePlaceholder}
                {...register("lane.origin")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="originVia">Origin via</FieldLabel>
              <Input
                id="originVia"
                placeholder="Optional via port"
                {...register("lane.originVia")}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="destinationVia">Destination via</FieldLabel>
              <Input
                id="destinationVia"
                placeholder="Optional via port"
                {...register("lane.destinationVia")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="destination">{destinationLabel}</FieldLabel>
              <Input
                id="destination"
                placeholder={codePlaceholder}
                {...register("lane.destination")}
              />
            </Field>
          </div>

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
            <div className="overflow-hidden rounded-none border">
              <Table>
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
                          name={`lane.containers.${index}.containerType`}
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
                          {...register(`lane.containers.${index}.count`, {
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
                          {...register(`lane.containers.${index}.weight`, {
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
        </>
      ) : null}

      {mode === "lcl" || mode === "air" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="origin">{originLabel}</FieldLabel>
              <Input
                id="origin"
                placeholder={codePlaceholder}
                {...register("lane.origin")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="destination">{destinationLabel}</FieldLabel>
              <Input
                id="destination"
                placeholder={codePlaceholder}
                {...register("lane.destination")}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Controller
              control={control}
              name="lane.palletType"
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
              <FieldLabel htmlFor="weight">Weight</FieldLabel>
              <Input
                id="weight"
                type="number"
                min={0}
                step="0.01"
                className="tabular-nums"
                {...register("lane.weight", { valueAsNumber: true })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="volume">Volume</FieldLabel>
              <Input
                id="volume"
                type="number"
                min={0}
                step="0.01"
                className="tabular-nums"
                {...register("lane.volume", { valueAsNumber: true })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="palletCount">Pallet count</FieldLabel>
              <Input
                id="palletCount"
                type="number"
                min={0}
                className="tabular-nums"
                {...register("lane.palletCount", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </>
      ) : null}
    </FieldGroup>
  )
}
