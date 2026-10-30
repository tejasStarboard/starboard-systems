import { z } from "zod"

import { formOptionSchema } from "./quotes.js"

export const createCustomerRequestSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
})

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>

export const customerOptionSchema = formOptionSchema

export const createCustomerResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})

export type CreateCustomerResponse = z.infer<
  typeof createCustomerResponseSchema
>

export const listCustomersResponseSchema = z.object({
  customers: z.array(customerOptionSchema),
})

export type ListCustomersResponse = z.infer<typeof listCustomersResponseSchema>

export const getCustomerNamesQuerySchema = z.object({
  ids: z
    .string()
    .optional()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    ),
})

export type GetCustomerNamesQuery = z.infer<typeof getCustomerNamesQuerySchema>

export const getCustomerNamesResponseSchema = z.object({
  customers: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
  ),
})

export type GetCustomerNamesResponse = z.infer<
  typeof getCustomerNamesResponseSchema
>
