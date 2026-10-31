import { z } from "zod"

import { doorAddressSchema, emptyDoorAddress } from "./door-address.js"
import { surchargeLineSchema } from "./surcharge.js"

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

export const legModeSchema = z.enum(["ocean", "air", "drayage"])
export type LegMode = z.infer<typeof legModeSchema>

export const cargoSchema = z.discriminatedUnion("mode", [
  z.object({
    id: z.string(),
    description: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    weight: z.number(),
    mode: z.literal("fcl"),
    containerCount: z.number().int(),
    containerType: z.string(),
  }),
  z.object({
    id: z.string(),
    description: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    weight: z.number(),
    mode: z.literal("lcl"),
    volume: z.number(),
    palletCount: z.number().int(),
    palletType: z.string(),
    hazmat: z.boolean(),
    fragile: z.boolean(),
  }),
  z.object({
    id: z.string(),
    description: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    weight: z.number(),
    mode: z.literal("air"),
    volume: z.number(),
    palletCount: z.number().int(),
    palletType: z.string(),
    hazmat: z.boolean(),
    fragile: z.boolean(),
  }),
])

export type Cargo = z.infer<typeof cargoSchema>

export const containerLineSchema = z.object({
  id: z.string(),
  containerType: z.string(),
  weight: z.number(),
  count: z.number(),
})

export type ContainerLine = z.infer<typeof containerLineSchema>

export const manualRateLineSchema = z.object({
  id: z.string(),
  label: z.string(),
  amount: z.number(),
  /** Always present on form values; factories default to []. */
  surcharges: z.array(surchargeLineSchema),
})

export type ManualRateLine = z.infer<typeof manualRateLineSchema>

export const markupTypeSchema = z.enum(["amount", "percent"])

export const laneFormSchema = z.object({
  id: z.string(),
  mode: laneModeSchema,
  /** Door pickup — Google Places snapshot (empty label = unset). */
  pickup: doorAddressSchema,
  origin: z.string(),
  originVia: z.string(),
  destinationVia: z.string(),
  destination: z.string(),
  /** Door delivery — Google Places snapshot (empty label = unset). */
  delivery: doorAddressSchema,
  containers: z.array(containerLineSchema),
  weight: z.number(),
  volume: z.number(),
  palletCount: z.number(),
  palletType: z.string(),
  manualRates: z.array(manualRateLineSchema),
  markupType: markupTypeSchema,
  markupValue: z.number(),
})

export type LaneFormValues = z.infer<typeof laneFormSchema>

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
  lanes: z.array(laneFormSchema).min(1),
})

export type QuoteFormValues = z.infer<typeof quoteFormSchema>

export const quoteListItemSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  source: quoteSourceSchema,
  status: quoteStatusSchema,
  customerId: z.string().nullable(),
  currencyCode: z.string().nullable(),
  ownerId: z.string(),
  organizationId: z.string(),
  effectiveFrom: z.string().nullable(),
  expiryAt: z.string().nullable(),
  createdAt: z.string(),
})

export type QuoteListItem = z.infer<typeof quoteListItemSchema>

/** BFF-enriched list row for the UI. */
export const quoteListItemViewSchema = quoteListItemSchema.extend({
  customerName: z.string().nullable(),
  ownerName: z.string(),
})

export type QuoteListItemView = z.infer<typeof quoteListItemViewSchema>

export const quotesListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  q: z.string().optional().default(""),
})

export type QuotesListQuery = z.infer<typeof quotesListQuerySchema>
export type QuotesListQueryInput = z.input<typeof quotesListQuerySchema>

export const listQuotesResponseSchema = z.object({
  quotes: z.array(quoteListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
})

export type ListQuotesResponse = z.infer<typeof listQuotesResponseSchema>

export const listQuotesViewResponseSchema = z.object({
  quotes: z.array(quoteListItemViewSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
})

export type ListQuotesViewResponse = z.infer<
  typeof listQuotesViewResponseSchema
>

export const formOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})

export type FormOption = z.infer<typeof formOptionSchema>

export const createQuoteRequestSchema = z.object({
  ownerId: z.string().min(1),
  organizationId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  source: quoteSourceSchema.optional(),
  currencyCode: z.string().nullable().optional(),
})

export type CreateQuoteRequest = z.infer<typeof createQuoteRequestSchema>

export const createQuoteResponseSchema = z.object({
  id: z.string(),
})

export const saveQuoteRequestSchema = z.object({
  ownerId: z.string().min(1),
  organizationId: z.string().min(1),
  quote: quoteFormSchema,
})

export type SaveQuoteRequest = z.infer<typeof saveQuoteRequestSchema>

export const saveQuoteResponseSchema = z.object({
  id: z.string(),
})

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

export function emptyLaneFormValues(mode: LaneMode = "fcl"): LaneFormValues {
  return {
    id: crypto.randomUUID(),
    mode,
    pickup: emptyDoorAddress(),
    origin: "",
    originVia: "",
    destinationVia: "",
    destination: "",
    delivery: emptyDoorAddress(),
    containers: mode === "fcl" ? [createContainerLine()] : [],
    weight: 0,
    volume: 0,
    palletCount: 0,
    palletType: "",
    manualRates: [],
    markupType: "amount",
    markupValue: 0,
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
    surcharges: [],
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
    lanes: [emptyLaneFormValues("fcl")],
  }
}
