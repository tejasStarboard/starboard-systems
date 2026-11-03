"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

import { useBreakpoint } from "@starboard/lib-ui/hooks/use-breakpoint"
import { toast } from "@starboard/lib-ui/components/toast"

import { QuoteBuilderShell } from "./quote-builder-shell"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"
import { isCommercialEditable } from "../lib/quote-stage"
import { useQuoteSlotEntries } from "../slots/slot-host"
import { QUOTING_SLOTS } from "../slots/types"
import { RatesSearchSheet, type ApplyRatePayload } from "./rates-search-sheet"
import {
  buildLaneUsageQuantities,
  calculateManualRateTotals,
  createManualRateLine,
  resolveSelectedManualRate,
  excludedBucketsForIncoterm,
  emptyLaneFormValues,
  isLaneReady,
  quoteFormSchema,
  type LaneFormValues,
  type QuoteFormOption,
  type QuoteFormValues,
} from "../lib/quotes.schema"

function usageFromLane(lane: LaneFormValues | undefined) {
  if (!lane) {
    return buildLaneUsageQuantities({})
  }
  if (lane.mode === "fcl") {
    const containerCount = lane.containers.reduce(
      (sum, line) => sum + (Number.isFinite(line.count) ? line.count : 0),
      0
    )
    const weightKg = lane.containers.reduce(
      (sum, line) => sum + (Number.isFinite(line.weight) ? line.weight : 0),
      0
    )
    return buildLaneUsageQuantities({ containerCount, weightKg })
  }
  return buildLaneUsageQuantities({
    weightKg: lane.weight,
    volumeCbm: lane.volume,
    palletCount: lane.palletCount,
  })
}

export function QuoteForm({
  defaultValues,
  customerOptions,
  currencyOptions,
  portOptions,
  containerTypeOptions,
  palletTypeOptions,
}: {
  defaultValues: QuoteFormValues
  customerOptions: QuoteFormOption[]
  currencyOptions: QuoteFormOption[]
  portOptions: QuoteFormOption[]
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
}) {
  const breakpoint = useBreakpoint()
  const [pending, startTransition] = useTransition()
  const [ratesOpen, setRatesOpen] = useState(false)
  // Rates may only be applied while the charge table is mounted; otherwise the
  // result would land in charge UI the user cannot see (quoting.charges off).
  const hasChargeTable =
    useQuoteSlotEntries(QUOTING_SLOTS.chargeTable).length > 0
  const [selectedLaneIndex, setSelectedLaneIndex] = useState(0)
  // Bumped on Cancel so the builder shell remounts with fresh navigation state
  // (step, per-lane steps, preview sheet) instead of showing a stale step.
  const [shellKey, setShellKey] = useState(0)
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
  const globalCharges = useWatch({
    control: form.control,
    name: "globalCharges",
  })
  const status = useWatch({ control: form.control, name: "status" })
  const currencyCode = useWatch({
    control: form.control,
    name: "currencyCode",
  })
  const exchangeRates = useWatch({
    control: form.control,
    name: "exchangeRates",
  })
  const incoterm = useWatch({
    control: form.control,
    name: "incoterm",
  })
  const customerRole = useWatch({
    control: form.control,
    name: "customerRole",
  })

  const excludedBuckets = useMemo(
    () =>
      excludedBucketsForIncoterm({
        incoterm,
        role: customerRole,
      }),
    [incoterm, customerRole]
  )

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

  const totals = useMemo(() => {
    const selectedRate = resolveSelectedManualRate(
      selectedLane?.manualRates ?? [],
      selectedLane?.selectedRateId
    )
    const equipmentAmounts = (selectedRate?.equipmentAmounts ?? []).map(
      (row) => ({
        ...row,
        count:
          selectedLane?.containers.find(
            (container) => container.containerType === row.containerType
          )?.count ?? 0,
      })
    )
    return calculateManualRateTotals({
      lines: selectedRate
        ? [
            {
              amount: selectedRate.amount,
              baseMode: selectedRate.baseMode,
              equipmentAmounts,
              surcharges: selectedRate.surcharges,
            },
          ]
        : [],
      markupType: selectedLane?.markupType ?? "amount",
      markupValue: Number(selectedLane?.markupValue) || 0,
      usage: usageFromLane(selectedLane),
      scope: { excluded_buckets: excludedBuckets },
      globalCharges: globalCharges ?? [],
      quoteCurrency: currencyCode || null,
      fxRates: exchangeRates ?? {},
    })
  }, [
    selectedLane,
    excludedBuckets,
    globalCharges,
    incoterm,
    customerRole,
    currencyCode,
    exchangeRates,
  ])

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
    if (!hasChargeTable) return
    if (selectedLaneId) {
      setManualRatesVisibleByLane((prev) => ({
        ...prev,
        [selectedLaneId]: true,
      }))
    }
    const line = createManualRateLine({ label: "Freight" })
    appendRate(line)
    form.setValue(`${lanePath}.selectedRateId`, line.id, { shouldDirty: true })
  }

  function handleRemoveRate(index: number) {
    const rates = form.getValues(`${lanePath}.manualRates`)
    const removed = rates[index]
    removeRate(index)
    const remaining = form.getValues(`${lanePath}.manualRates`)
    if (
      removed &&
      form.getValues(`${lanePath}.selectedRateId`) === removed.id
    ) {
      form.setValue(`${lanePath}.selectedRateId`, remaining[0]?.id ?? "", {
        shouldDirty: true,
      })
    }
  }

  function handleApplyRate({
    line,
    currencyCode: appliedCurrency,
  }: ApplyRatePayload) {
    if (!hasChargeTable) return
    if (selectedLaneId) {
      setManualRatesVisibleByLane((prev) => ({
        ...prev,
        [selectedLaneId]: true,
      }))
    }
    appendRate(line)
    form.setValue(`${lanePath}.selectedRateId`, line.id, { shouldDirty: true })

    const quoteCurrency = (form.getValues("currencyCode") ?? "").toUpperCase()
    const rateCurrency = appliedCurrency.toUpperCase()
    if (
      quoteCurrency.length === 3 &&
      rateCurrency.length === 3 &&
      quoteCurrency !== rateCurrency
    ) {
      toast.add({
        type: "warning",
        title: "Currency differs",
        description: `Applied ${rateCurrency} amount onto a ${quoteCurrency} quote. Convert manually if needed.`,
      })
    }
  }

  function handleCancel() {
    form.reset(defaultValues)
    setSelectedLaneIndex(0)
    setShellKey((key) => key + 1)
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
    portOptions,
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
    excludedBuckets,
    currencyCode: currencyCode ?? "",
    pending,
    isDirty: form.formState.isDirty,
    commercialEditable: isCommercialEditable(status ?? "draft"),
    onSelectLane: setSelectedLaneIndex,
    onAddLane: handleAddLane,
    onRemoveLane: handleRemoveLane,
    onSearchRates: () => {
      if (hasChargeTable) setRatesOpen(true)
    },
    onAddManualRate: handleAddManualRate,
    onAppendRate: () => {
      const line = createManualRateLine({ label: "Rate" })
      appendRate(line)
      form.setValue(`${lanePath}.selectedRateId`, line.id, {
        shouldDirty: true,
      })
    },
    onRemoveRate: handleRemoveRate,
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

        <QuoteBuilderShell
          key={shellKey}
          props={layoutProps}
          layout={breakpoint}
        />
      </form>

      <RatesSearchSheet
        open={ratesOpen && hasChargeTable}
        onOpenChange={setRatesOpen}
        origin={selectedLane?.origin || undefined}
        destination={selectedLane?.destination || undefined}
        onApplyRate={handleApplyRate}
      />
    </div>
  )
}
