import { z } from "zod"

import type { CustomerRecord } from "@starboard/lib-contracts"

const optionalEmailField = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    { message: "Invalid email" }
  )

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  email: optionalEmailField,
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  countryCode: z.string(),
  zip: z.string(),
  isCustomer: z.boolean(),
  isVendor: z.boolean(),
  isActive: z.boolean(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const createCustomerFormSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
})

export type CreateCustomerFormValues = z.infer<typeof createCustomerFormSchema>

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required"),
  email: optionalEmailField,
  phone: z.string(),
  role: z.string(),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>

export const emptyContactFormValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  role: "",
}

export function customerToFormValues(row: CustomerRecord): CustomerFormValues {
  return {
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    countryCode: row.countryCode ?? "",
    zip: row.zip ?? "",
    isCustomer: row.isCustomer === true,
    isVendor: row.isVendor === true,
    isActive: row.isActive === true,
  }
}
