import { z } from "zod"

export const quoteSourceSchema = z.enum(["email", "manual"])
export type QuoteSource = z.infer<typeof quoteSourceSchema>

export const quoteStatusSchema = z.enum([
  "draft",
  "review",
  "sent",
  "win",
  "loss",
  "expired",
])
export type QuoteStatus = z.infer<typeof quoteStatusSchema>

export const laneModeSchema = z.enum(["fcl", "lcl", "air"])
export type LaneMode = z.infer<typeof laneModeSchema>

export const containerLineSchema = z.object({
  id: z.string(),
  containerType: z.string(),
  weight: z.number(),
  count: z.number(),
})

export type ContainerLine = z.infer<typeof containerLineSchema>

export const laneFormSchema = z.object({
  mode: laneModeSchema,
  pickup: z.string(),
  origin: z.string(),
  originVia: z.string(),
  destinationVia: z.string(),
  destination: z.string(),
  delivery: z.string(),
  containers: z.array(containerLineSchema),
  weight: z.number(),
  volume: z.number(),
  palletCount: z.number(),
  palletType: z.string(),
})

export type LaneFormValues = z.infer<typeof laneFormSchema>

export const manualRateLineSchema = z.object({
  id: z.string(),
  label: z.string(),
  amount: z.number(),
})

export type ManualRateLine = z.infer<typeof manualRateLineSchema>

export const markupTypeSchema = z.enum(["amount", "percent"])

export const quoteFormSchema = z.object({
  id: z.string(),
  quoteId: z.string().max(6),
  source: quoteSourceSchema,
  status: quoteStatusSchema,
  customerId: z.string(),
  currencyCode: z
    .string()
    .refine(
      (value) => value === "" || /^[A-Za-z]{3}$/.test(value),
      "Currency must be a 3-letter code"
    ),
  effectiveFrom: z.string(),
  expiryAt: z.string(),
  lane: laneFormSchema,
  manualRates: z.array(manualRateLineSchema),
  markupType: markupTypeSchema,
  markupValue: z.number(),
})

export type QuoteFormValues = z.infer<typeof quoteFormSchema>

export type QuoteListItem = {
  id: string
  quoteId: string
  source: QuoteSource
  status: QuoteStatus
  customerId: string | null
  customerName: string | null
  currencyCode: string | null
  ownerName: string
  effectiveFrom: string | null
  expiryAt: string | null
  createdAt: string
}

export type QuoteFormOption = {
  value: string
  label: string
}

export function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) {
    return ""
  }

  const value = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(value.getTime())) {
    return ""
  }

  return value.toISOString().slice(0, 10)
}

export function createContainerLine(
  overrides?: Partial<ContainerLine>
): ContainerLine {
  return {
    id: crypto.randomUUID(),
    containerType: "",
    weight: 0,
    count: 1,
    ...overrides,
  }
}

export function emptyLaneFormValues(
  mode: LaneMode = "fcl"
): LaneFormValues {
  return {
    mode,
    pickup: "",
    origin: "",
    originVia: "",
    destinationVia: "",
    destination: "",
    delivery: "",
    containers: mode === "fcl" ? [createContainerLine()] : [],
    weight: 0,
    volume: 0,
    palletCount: 0,
    palletType: "",
  }
}

/** Rate actions unlock once origin + destination ports/airports are set. */
export function isLaneReady(lane: LaneFormValues) {
  return lane.origin.trim().length > 0 && lane.destination.trim().length > 0
}

export function createManualRateLine(
  overrides?: Partial<ManualRateLine>
): ManualRateLine {
  return {
    id: crypto.randomUUID(),
    label: "",
    amount: 0,
    ...overrides,
  }
}

export function emptyQuoteFormValues(input: {
  id: string
  customerId?: string
  quoteId?: string
}): QuoteFormValues {
  return {
    id: input.id,
    quoteId: input.quoteId ?? "",
    source: "manual",
    status: "draft",
    customerId: input.customerId ?? "",
    currencyCode: "",
    effectiveFrom: "",
    expiryAt: "",
    lane: emptyLaneFormValues("fcl"),
    manualRates: [],
    markupType: "amount",
    markupValue: 0,
  }
}

export function calculateManualRateTotals(input: {
  lines: Array<{ amount: number }>
  markupType: z.infer<typeof markupTypeSchema>
  markupValue: number
}) {
  const subtotal = input.lines.reduce(
    (sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0),
    0
  )
  const markupValue = Number.isFinite(input.markupValue) ? input.markupValue : 0
  const markup =
    input.markupType === "percent"
      ? (subtotal * markupValue) / 100
      : markupValue

  return {
    subtotal,
    markup,
    total: subtotal + markup,
  }
}
