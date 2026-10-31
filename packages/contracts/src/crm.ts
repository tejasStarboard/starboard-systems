import { z } from "zod"

import { formOptionSchema } from "./quotes.js"

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const optionalEmailSchema = z
  .string()
  .trim()
  .nullish()
  .transform(emptyToNull)
  .refine(
    (value) => value == null || z.string().email().safeParse(value).success,
    {
      message: "Invalid email",
    }
  )

const optionalTextSchema = z.string().trim().nullish().transform(emptyToNull)

export const customerRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  countryCode: z.string().nullable(),
  zip: z.string().nullable(),
  isCustomer: z.boolean(),
  isVendor: z.boolean(),
  isActive: z.boolean(),
})

export type CustomerRecord = z.infer<typeof customerRecordSchema>

export const createCustomerRequestSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  email: optionalEmailSchema.optional(),
  phone: optionalTextSchema.optional(),
  address: optionalTextSchema.optional(),
  city: optionalTextSchema.optional(),
  state: optionalTextSchema.optional(),
  countryCode: optionalTextSchema.optional(),
  zip: optionalTextSchema.optional(),
  isCustomer: z.boolean().optional().default(true),
  isVendor: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
})

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>
/** Wire body before Zod defaults (name-only quote create is valid). */
export type CreateCustomerRequestInput = z.input<
  typeof createCustomerRequestSchema
>

export const updateCustomerRequestSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").optional(),
  email: optionalEmailSchema.optional(),
  phone: optionalTextSchema.optional(),
  address: optionalTextSchema.optional(),
  city: optionalTextSchema.optional(),
  state: optionalTextSchema.optional(),
  countryCode: optionalTextSchema.optional(),
  zip: optionalTextSchema.optional(),
  isCustomer: z.boolean().optional(),
  isVendor: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateCustomerRequest = z.infer<typeof updateCustomerRequestSchema>

export const customerOptionSchema = formOptionSchema

export const createCustomerResponseSchema = customerRecordSchema

export type CreateCustomerResponse = z.infer<
  typeof createCustomerResponseSchema
>

export const listCustomersResponseSchema = z.object({
  customers: z.array(customerOptionSchema),
})

export type ListCustomersResponse = z.infer<typeof listCustomersResponseSchema>

export const contactRecordSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
})

export type ContactRecord = z.infer<typeof contactRecordSchema>

export const customerListItemSchema = customerRecordSchema.extend({
  contacts: z.array(contactRecordSchema).default([]),
})

export type CustomerListItem = z.infer<typeof customerListItemSchema>

export const listCustomerRecordsResponseSchema = z.object({
  customers: z.array(customerListItemSchema),
})

export type ListCustomerRecordsResponse = z.infer<
  typeof listCustomerRecordsResponseSchema
>

export const getCustomerResponseSchema = customerRecordSchema

export type GetCustomerResponse = z.infer<typeof getCustomerResponseSchema>

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

export const createContactRequestSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required"),
  email: optionalEmailSchema.optional(),
  phone: optionalTextSchema.optional(),
  role: optionalTextSchema.optional(),
})

export type CreateContactRequest = z.infer<typeof createContactRequestSchema>

export const updateContactRequestSchema = createContactRequestSchema.partial()

export type UpdateContactRequest = z.infer<typeof updateContactRequestSchema>

export const listContactsResponseSchema = z.object({
  contacts: z.array(contactRecordSchema),
})

export type ListContactsResponse = z.infer<typeof listContactsResponseSchema>
