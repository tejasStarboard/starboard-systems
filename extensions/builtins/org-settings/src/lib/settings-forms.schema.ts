import { z } from "zod"

export const companyFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().min(1, "Slug is required"),
})

export type CompanyFormValues = z.infer<typeof companyFormSchema>

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string(),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const quotePreferencesFormSchema = z.object({
  defaultValidityDays: z
    .string()
    .trim()
    .min(1, "Enter a validity of at least 1 day")
    .refine((value) => /^\d+$/.test(value), {
      message: "Enter a whole number of days",
    })
    .refine((value) => Number.parseInt(value, 10) >= 1, {
      message: "Enter a validity of at least 1 day",
    }),
  /** Blank clears the org default. */
  defaultBaseCurrency: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[A-Za-z]{3}$/.test(value), {
      message: "Pick a 3-letter currency",
    }),
})

export type QuotePreferencesFormValues = z.infer<
  typeof quotePreferencesFormSchema
>

export const teamInviteFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["member", "admin"]),
})

export type TeamInviteFormValues = z.infer<typeof teamInviteFormSchema>
