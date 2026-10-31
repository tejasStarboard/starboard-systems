import { z } from "zod"

import { formOptionSchema } from "./quotes.js"

export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code")

export const ensureCurrencyRequestSchema = z.object({
  code: currencyCodeSchema,
})

export type EnsureCurrencyRequest = z.infer<typeof ensureCurrencyRequestSchema>

export const ensureCurrencyResponseSchema = z.object({
  code: z.string(),
})

export const listCurrenciesResponseSchema = z.object({
  currencies: z.array(formOptionSchema),
})

export type ListCurrenciesResponse = z.infer<
  typeof listCurrenciesResponseSchema
>

export const listPortsQuerySchema = z.object({
  q: z.string().optional().default(""),
})

export type ListPortsQuery = z.infer<typeof listPortsQuerySchema>

/** Facility search hit — FormOption-compatible soft code + label. */
export const facilityOptionSchema = formOptionSchema.extend({
  types: z.array(z.string()).optional(),
  country: z.string().optional(),
})

export type FacilityOption = z.infer<typeof facilityOptionSchema>

/** @deprecated Use facilityOptionSchema — kept for quote picker FormOption mapping. */
export const portOptionSchema = facilityOptionSchema

export const listPortsResponseSchema = z.object({
  ports: z.array(facilityOptionSchema),
})

export type ListPortsResponse = z.infer<typeof listPortsResponseSchema>

/** App-level facility write validation (at least one of unlocode / iata). */
export const facilityInputSchema = z
  .object({
    id: z.string().min(1),
    unlocode: z.string().min(3).max(7).nullable().optional(),
    iata: z.string().length(3).nullable().optional(),
    name: z.string().min(1),
    facilityTypes: z.array(z.string()).default([]),
    countryCode: z.string().length(2),
    admin1: z.string().nullable().optional(),
    cityName: z.string().nullable().optional(),
    aliases: z.array(z.string()).default([]),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    isPrimary: z.boolean().optional(),
  })
  .refine((row) => Boolean(row.unlocode?.trim()) || Boolean(row.iata?.trim()), {
    message: "Facility requires unlocode and/or iata",
  })

export type FacilityInput = z.infer<typeof facilityInputSchema>
