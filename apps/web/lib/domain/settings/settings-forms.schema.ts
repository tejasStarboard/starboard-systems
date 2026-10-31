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

export const quoteRulesFormSchema = z.object({
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
})

export type QuoteRulesFormValues = z.infer<typeof quoteRulesFormSchema>

export const teamInviteFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["member", "admin"]),
})

export type TeamInviteFormValues = z.infer<typeof teamInviteFormSchema>

export const sendMessageFormSchema = z.object({
  toAddress: z.string().trim().min(1, "Recipient is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().trim().min(1, "Body is required"),
})

export type SendMessageFormValues = z.infer<typeof sendMessageFormSchema>
