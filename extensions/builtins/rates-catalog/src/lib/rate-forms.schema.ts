import { z } from "zod"

import { laneModeSchema } from "@starboard/lib-contracts"

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const rateFormSchema = z.object({
  label: z.string().trim().min(1, "Rate label is required"),
  origin: z.string().max(7),
  destination: z.string().max(7),
  customerId: z.string(),
  mode: laneModeSchema,
  carrier: z.string(),
  currencyCode: z
    .string()
    .trim()
    .length(3, "Currency code must be 3 characters"),
  amount: z.number().finite("Amount must be a finite number"),
  validFrom: z.string().min(1, "validFrom is required"),
  validTo: z.string().min(1, "validTo is required"),
})

export type RateFormValues = z.infer<typeof rateFormSchema>

export function rateFormToPayload(values: RateFormValues) {
  return {
    label: values.label.trim(),
    origin: emptyToNull(values.origin),
    destination: emptyToNull(values.destination),
    customerId: emptyToNull(values.customerId),
    mode: values.mode,
    carrier: emptyToNull(values.carrier),
    currencyCode: values.currencyCode.trim().toUpperCase(),
    amount: values.amount,
    validFrom: new Date(values.validFrom).toISOString(),
    validTo: new Date(values.validTo).toISOString(),
    source: "manual" as const,
  }
}

export function defaultRateFormValues(
  overrides: Partial<RateFormValues> = {}
): RateFormValues {
  const today = new Date()
  const inAYear = new Date(today)
  inAYear.setFullYear(today.getFullYear() + 1)
  return {
    label: "",
    origin: "",
    destination: "",
    customerId: "",
    mode: "fcl",
    carrier: "",
    currencyCode: "USD",
    amount: 0,
    validFrom: today.toISOString().slice(0, 10),
    validTo: inAYear.toISOString().slice(0, 10),
    ...overrides,
  }
}
