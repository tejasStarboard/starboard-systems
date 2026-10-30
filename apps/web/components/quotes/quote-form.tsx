"use client"

import { useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CopyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
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

import { CustomerCombobox } from "@/components/quotes/customer-combobox"
import { LaneFields } from "@/components/quotes/lane-fields"
import { RatesSearchSheet } from "@/components/quotes/rates-search-sheet"
import {
  calculateManualRateTotals,
  createManualRateLine,
  isLaneReady,
  quoteFormSchema,
  quoteStatusSchema,
  type QuoteFormOption,
  type QuoteFormValues,
} from "@/lib/quotes/schema"
import { toast } from "@workspace/ui/components/toast"
import { Separator } from "@workspace/ui/components/separator"

const quoteStatusOptions = quoteStatusSchema.options


function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return value.toFixed(2)
  }
}

export function QuoteForm({
  defaultValues,
  customerOptions,
  currencyOptions,
  containerTypeOptions,
  palletTypeOptions,
}: {
  defaultValues: QuoteFormValues
  customerOptions: QuoteFormOption[]
  currencyOptions: QuoteFormOption[]
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
}) {
  const [pending, startTransition] = useTransition()
  const [ratesOpen, setRatesOpen] = useState(false)
  const [manualRatesVisible, setManualRatesVisible] = useState(
    defaultValues.manualRates.length > 0
  )

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "manualRates",
  })

  const lane = useWatch({ control: form.control, name: "lane" })
  const manualRates = useWatch({ control: form.control, name: "manualRates" })
  const markupType = useWatch({ control: form.control, name: "markupType" })
  const markupValue = useWatch({ control: form.control, name: "markupValue" })
  const currencyCode = useWatch({
    control: form.control,
    name: "currencyCode",
  })

  const laneReady = useMemo(
    () => isLaneReady(lane ?? defaultValues.lane),
    [lane, defaultValues.lane]
  )

  const totals = useMemo(
    () =>
      calculateManualRateTotals({
        lines: manualRates ?? [],
        markupType: markupType ?? "amount",
        markupValue: Number(markupValue) || 0,
      }),
    [manualRates, markupType, markupValue]
  )

  function onSubmit(values: QuoteFormValues) {
    startTransition(async () => {
      const response = await fetch(`/api/quotes/${values.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        toast.add({
          type: "error",
          title: "Unable to save quote",
          description: payload?.error ?? "Something went wrong. Try again.",
        })
        return
      }

      form.reset(values)
      toast.add({
        type: "success",
        title: "Quote saved",
      })
    })
  }

  function handleAddManualRate() {
    if (!manualRatesVisible) {
      setManualRatesVisible(true)
    }
    append(createManualRateLine({ label: "Freight" }))
  }

  return (
    <div className="flex flex-col h-full">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-6 h-full"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
          <div className="space-y-1">
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Quote
            </p>
            <div className="flex items-center gap-2">
              <p className="font-medium tabular-nums">
                {defaultValues.quoteId}
              </p>
              <Button variant="outline" size="icon-sm" onClick={() => {
                navigator.clipboard.writeText(defaultValues.quoteId)
                toast.add({
                  title: "Quote ID copied to clipboard",
                  description: "You can now paste it into your email or chat",
                })
              }}
              disabled={!defaultValues.quoteId}
              >
                <CopyIcon />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-end gap-3">
            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <Field
                  className="w-[8.5rem]"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (
                        value === "draft" ||
                        value === "review" ||
                        value === "sent" ||
                        value === "win" ||
                        value === "loss" ||
                        value === "expired"
                      ) {
                        field.onChange(value)
                      }
                    }}
                  >
                    <SelectTrigger
                      className="w-full capitalize"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quoteStatusOptions.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          className="capitalize"
                        >
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="customerId"
              render={({ field, fieldState }) => (
                <Field
                  className="min-w-[12rem] flex-1"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel>Customer</FieldLabel>
                  <CustomerCombobox
                    options={customerOptions}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="currencyCode"
              render={({ field, fieldState }) => (
                <Field
                  className="w-[7.5rem]"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel>Currency</FieldLabel>
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => {
                      field.onChange(value ?? "")
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Field
              className="w-[10.5rem]"
              data-invalid={!!form.formState.errors.effectiveFrom || undefined}
            >
              <FieldLabel htmlFor="effectiveFrom">Effective</FieldLabel>
              <Input
                id="effectiveFrom"
                type="date"
                aria-invalid={!!form.formState.errors.effectiveFrom}
                {...form.register("effectiveFrom")}
              />
              <FieldError errors={[form.formState.errors.effectiveFrom]} />
            </Field>

            <Field
              className="w-[10.5rem]"
              data-invalid={!!form.formState.errors.expiryAt || undefined}
            >
              <FieldLabel htmlFor="expiryAt">Expires</FieldLabel>
              <Input
                id="expiryAt"
                type="date"
                aria-invalid={!!form.formState.errors.expiryAt}
                {...form.register("expiryAt")}
              />
              <FieldError errors={[form.formState.errors.expiryAt]} />
            </Field>
          </div>
        </div>

        <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 flex-1">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Lane</h2>
            <p className="text-xs text-muted-foreground">
              Choose a mode and set the route. Rate actions unlock once origin
              and destination are set.
            </p>
          </div>

          <LaneFields
            control={form.control}
            register={form.register}
            setValue={form.setValue}
            containerTypeOptions={containerTypeOptions}
            palletTypeOptions={palletTypeOptions}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!laneReady}
              onClick={() => setRatesOpen(true)}
            >
              <MagnifyingGlassIcon data-icon="inline-start" />
              Search rates
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!laneReady}
              onClick={handleAddManualRate}
            >
              <PlusIcon data-icon="inline-start" />
              Add manual rate
            </Button>
          </div>

          {manualRatesVisible ? (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Manual rates</h3>
                <p className="text-xs text-muted-foreground">
                  Build an invoice-style breakdown for this lane.
                </p>
              </div>

              <div className="overflow-hidden rounded-none border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Charge</TableHead>
                      <TableHead className="w-40 text-right">Amount</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length ? (
                      fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Input
                              placeholder="Surcharge label"
                              {...form.register(`manualRates.${index}.label`)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              className="text-right tabular-nums"
                              {...form.register(`manualRates.${index}.amount`, {
                                valueAsNumber: true,
                              })}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Remove charge"
                              onClick={() => remove(index)}
                            >
                              <TrashIcon />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-16 text-center text-muted-foreground"
                        >
                          No charges yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append(createManualRateLine())}
              >
                <PlusIcon data-icon="inline-start" />
                Add charge
              </Button>

              <div className="ml-auto flex w-full max-w-sm flex-col gap-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatMoney(totals.subtotal, currencyCode)}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <Field className="flex-1">
                    <FieldLabel>Markup</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={form.control}
                        name="markupType"
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
                        {...form.register("markupValue", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </Field>
                  <span className="pb-2 text-xs tabular-nums">
                    {formatMoney(totals.markup, currencyCode)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-3 text-sm font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatMoney(totals.total, currencyCode)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

        </section>

        <input type="hidden" {...form.register("id")} />
        <input type="hidden" {...form.register("quoteId")} />
        <input type="hidden" {...form.register("source")} />

<Separator/>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => form.reset(defaultValues)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !form.formState.isDirty}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>

      <RatesSearchSheet open={ratesOpen} onOpenChange={setRatesOpen} />
    </div>
  )
}
