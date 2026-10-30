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

export const portOptionSchema = formOptionSchema
export const listPortsResponseSchema = z.object({
  ports: z.array(portOptionSchema),
})

export type ListPortsResponse = z.infer<typeof listPortsResponseSchema>
