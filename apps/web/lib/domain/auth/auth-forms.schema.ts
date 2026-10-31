import { z } from "zod"

export const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export const registerFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type RegisterFormValues = z.infer<typeof registerFormSchema>

export const forgotPasswordFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>

export const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>

export const createOrganizationFormSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens"
    ),
})

export type CreateOrganizationFormValues = z.infer<
  typeof createOrganizationFormSchema
>
