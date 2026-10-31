import { z } from "zod"

import { laneModeSchema } from "./quotes.js"
import { surchargeLineSchema } from "./surcharge.js"

export const rateSourceSchema = z.enum(["manual", "ingestion", "spot"])
export type RateSource = z.infer<typeof rateSourceSchema>

/** Catalog charge line — same lean shape as quote surcharges (persist prep). */
export const catalogSurchargeSchema = surchargeLineSchema
export type CatalogSurcharge = z.infer<typeof catalogSurchargeSchema>

export const rateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  origin: z.string().max(7).nullable(),
  destination: z.string().max(7).nullable(),
  customerId: z.string().min(1).nullable(),
  mode: laneModeSchema,
  carrier: z.string().nullable(),
  label: z.string(),
  currencyCode: z.string().length(3),
  amount: z.number(),
  validFrom: z.string().min(1),
  validTo: z.string().min(1),
  source: rateSourceSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  /** Prepared for catalog charge lines; not yet loaded by rates DAO. */
  surcharges: z.array(catalogSurchargeSchema),
})

export type Rate = z.infer<typeof rateSchema>

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const createRateRequestSchema = z.object({
  origin: z.string().max(7).nullish().transform(emptyToNull),
  destination: z.string().max(7).nullish().transform(emptyToNull),
  customerId: z.string().nullish().transform(emptyToNull),
  mode: laneModeSchema.default("fcl"),
  carrier: z.string().nullish().transform(emptyToNull),
  label: z.string().trim().min(1, "Rate label is required"),
  currencyCode: z
    .string()
    .trim()
    .length(3, "Currency code must be 3 characters"),
  amount: z.number().finite("Amount must be a finite number"),
  validFrom: z.string().min(1, "validFrom is required"),
  validTo: z.string().min(1, "validTo is required"),
  source: rateSourceSchema.default("manual"),
})

export type CreateRateRequest = z.infer<typeof createRateRequestSchema>

export const createRateResponseSchema = rateSchema
export type CreateRateResponse = z.infer<typeof createRateResponseSchema>

export const listRatesQuerySchema = z.object({
  q: z.string().optional().default(""),
  origin: z.string().optional().default(""),
  destination: z.string().optional().default(""),
  customerId: z.string().optional().default(""),
  validAt: z.string().optional().default(""),
})

export type ListRatesQuery = z.infer<typeof listRatesQuerySchema>

export const listRatesResponseSchema = z.object({
  rates: z.array(rateSchema),
})

export type ListRatesResponse = z.infer<typeof listRatesResponseSchema>

export const getRateResponseSchema = rateSchema
export type GetRateResponse = z.infer<typeof getRateResponseSchema>
