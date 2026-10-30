"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

import { useBreakpoint } from "@workspace/ui/hooks/use-breakpoint"
import { toast } from "@workspace/ui/components/toast"

import { QuoteFormDesktop } from "@/components/quotes/quote-form-desktop"
import type { QuoteFormLayoutProps } from "@/components/quotes/quote-form-layout-props"
import { QuoteFormMobile } from "@/components/quotes/quote-form-mobile"
import { QuoteFormTablet } from "@/components/quotes/quote-form-tablet"
import { RatesSearchSheet } from "@/components/quotes/rates-search-sheet"
import {
  calculateManualRateTotals,
  createManualRateLine,
  emptyLaneFormValues,
  isLaneReady,
  quoteFormSchema,
  type QuoteFormOption,
  type QuoteFormValues,
} from "@/lib/quotes/schema"

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
  const breakpoint = useBreakpoint()
  const [pending, startTransition] = useTransition()
  const [ratesOpen, setRatesOpen] = useState(false)
  const [selectedLaneIndex, setSelectedLaneIndex] = useState(0)
  const [manualRatesVisibleByLane, setManualRatesVisibleByLane] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      defaultValues.lanes.map((lane) => [lane.id, lane.manualRates.length > 0])
    )
  )

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues,
  })

  const {
    fields: laneFields,
    append: appendLane,
    remove: removeLane,
  } = useFieldArray({
    control: form.control,
    name: "lanes",
  })

  const lanePath = `lanes.${selectedLaneIndex}` as const

  const {
    fields: rateFields,
    append: appendRate,
    remove: removeRate,
  } = useFieldArray({
    control: form.control,
    name: `${lanePath}.manualRates`,
  })

  const selectedLane = useWatch({
    control: form.control,
    name: lanePath,
  })
  const lanes = useWatch({ control: form.control, name: "lanes" })
  const currencyCode = useWatch({
    control: form.control,
    name: "currencyCode",
  })

  useEffect(() => {
    if (selectedLaneIndex > laneFields.length - 1) {
      setSelectedLaneIndex(Math.max(0, laneFields.length - 1))
    }
  }, [laneFields.length, selectedLaneIndex])

  const laneReady = useMemo(
    () =>
      isLaneReady(
        selectedLane ??
          defaultValues.lanes[selectedLaneIndex] ??
          emptyLaneFormValues()
      ),
    [selectedLane, defaultValues.lanes, selectedLaneIndex]
  )

  const selectedLaneId = selectedLane?.id
  const manualRatesVisible = selectedLaneId
    ? Boolean(manualRatesVisibleByLane[selectedLaneId])
    : false

  const totals = useMemo(
    () =>
      calculateManualRateTotals({
        lines: selectedLane?.manualRates ?? [],
        markupType: selectedLane?.markupType ?? "amount",
        markupValue: Number(selectedLane?.markupValue) || 0,
      }),
    [selectedLane]
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

  function handleAddLane() {
    const next = emptyLaneFormValues("fcl")
    if (next.containers[0] && containerTypeOptions[0]) {
      next.containers[0].containerType = containerTypeOptions[0].value
    }
    appendLane(next)
    setManualRatesVisibleByLane((prev) => ({
      ...prev,
      [next.id]: false,
    }))
    setSelectedLaneIndex(laneFields.length)
  }

  function handleRemoveLane(index: number) {
    if (laneFields.length <= 1) return
    const removedId = lanes?.[index]?.id
    removeLane(index)
    if (removedId) {
      setManualRatesVisibleByLane((prev) => {
        const next = { ...prev }
        delete next[removedId]
        return next
      })
    }
    setSelectedLaneIndex((current) => {
      if (index < current) return current - 1
      if (index === current) return Math.max(0, current - 1)
      return current
    })
  }

  function handleAddManualRate() {
    if (selectedLaneId) {
      setManualRatesVisibleByLane((prev) => ({
        ...prev,
        [selectedLaneId]: true,
      }))
    }
    appendRate(createManualRateLine({ label: "Freight" }))
  }

  function handleCancel() {
    form.reset(defaultValues)
    setSelectedLaneIndex(0)
    setManualRatesVisibleByLane(
      Object.fromEntries(
        defaultValues.lanes.map((lane) => [
          lane.id,
          lane.manualRates.length > 0,
        ])
      )
    )
  }

  const layoutProps: QuoteFormLayoutProps = {
    quoteId: defaultValues.quoteId,
    control: form.control,
    register: form.register,
    setValue: form.setValue,
    errors: form.formState.errors,
    customerOptions,
    currencyOptions,
    containerTypeOptions,
    palletTypeOptions,
    laneFields,
    lanes,
    selectedLane,
    selectedLaneIndex,
    selectedLaneId,
    lanePath,
    laneReady,
    rateFields,
    manualRatesVisible,
    totals,
    currencyCode: currencyCode ?? "",
    pending,
    isDirty: form.formState.isDirty,
    onSelectLane: setSelectedLaneIndex,
    onAddLane: handleAddLane,
    onRemoveLane: handleRemoveLane,
    onSearchRates: () => setRatesOpen(true),
    onAddManualRate: handleAddManualRate,
    onAppendRate: () => appendRate(createManualRateLine()),
    onRemoveRate: removeRate,
    onCancel: handleCancel,
  }

  return (
    <div className="flex h-full flex-col">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full w-full flex-col gap-4"
      >
        <input type="hidden" {...form.register("id")} />
        <input type="hidden" {...form.register("quoteId")} />
        <input type="hidden" {...form.register("source")} />

        {breakpoint === "mobile" ? (
          <QuoteFormMobile {...layoutProps} />
        ) : breakpoint === "tablet" ? (
          <QuoteFormTablet {...layoutProps} />
        ) : (
          <QuoteFormDesktop {...layoutProps} />
        )}
      </form>

      <RatesSearchSheet open={ratesOpen} onOpenChange={setRatesOpen} />
    </div>
  )
}
