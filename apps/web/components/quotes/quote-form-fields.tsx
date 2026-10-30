"use client"

import { CopyIcon } from "@phosphor-icons/react"
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { toast } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"

import { CustomerCombobox } from "@/components/quotes/customer-combobox"
import {
  quoteStatusSchema,
  type QuoteFormOption,
  type QuoteFormValues,
} from "@/lib/quotes/schema"

const quoteStatusOptions = quoteStatusSchema.options

export function QuoteIdField({
  quoteId,
  className,
}: {
  quoteId: string
  className?: string
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        Quote ID
      </p>
      <div className="flex items-center gap-2">
        <p className="font-medium tabular-nums">{quoteId}</p>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => {
            navigator.clipboard.writeText(quoteId)
            toast.add({
              title: "Quote ID copied to clipboard",
              description: "You can now paste it into your email or chat",
            })
          }}
          disabled={!quoteId}
        >
          <CopyIcon />
        </Button>
      </div>
    </div>
  )
}

export function QuoteStatusField({
  control,
  className,
}: {
  control: Control<QuoteFormValues>
  className?: string
}) {
  return (
    <Controller
      control={control}
      name="status"
      render={({ field, fieldState }) => (
        <Field
          className={cn(className)}
          data-invalid={fieldState.invalid || undefined}
        >
          <FieldLabel>Status</FieldLabel>
          <Select
            value={field.value}
            onValueChange={(value) => {
              if (
                value === "draft" ||
                value === "review" ||
                value === "sent" ||
                value === "win" ||
                value === "loss" ||
                value === "expired"
              ) {
                field.onChange(value)
              }
            }}
          >
            <SelectTrigger
              className="w-full capitalize"
              aria-invalid={fieldState.invalid}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quoteStatusOptions.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  className="capitalize"
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function QuoteCustomerField({
  control,
  customerOptions,
  className,
}: {
  control: Control<QuoteFormValues>
  customerOptions: QuoteFormOption[]
  className?: string
}) {
  return (
    <Controller
      control={control}
      name="customerId"
      render={({ field, fieldState }) => (
        <Field
          className={cn(className)}
          data-invalid={fieldState.invalid || undefined}
        >
          <FieldLabel>Customer</FieldLabel>
          <CustomerCombobox
            options={customerOptions}
            value={field.value}
            onChange={field.onChange}
            invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function QuoteCurrencyField({
  control,
  currencyOptions,
  className,
}: {
  control: Control<QuoteFormValues>
  currencyOptions: QuoteFormOption[]
  className?: string
}) {
  return (
    <Controller
      control={control}
      name="currencyCode"
      render={({ field, fieldState }) => (
        <Field
          className={cn(className)}
          data-invalid={fieldState.invalid || undefined}
        >
          <FieldLabel>Currency</FieldLabel>
          <Select
            value={field.value || null}
            onValueChange={(value) => {
              field.onChange(value ?? "")
            }}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function QuoteEffectiveField({
  register,
  errors,
  className,
}: {
  register: UseFormRegister<QuoteFormValues>
  errors: FieldErrors<QuoteFormValues>
  className?: string
}) {
  return (
    <Field
      className={cn(className)}
      data-invalid={!!errors.effectiveFrom || undefined}
    >
      <FieldLabel htmlFor="effectiveFrom">Effective</FieldLabel>
      <Input
        id="effectiveFrom"
        type="date"
        aria-invalid={!!errors.effectiveFrom}
        {...register("effectiveFrom")}
      />
      <FieldError errors={[errors.effectiveFrom]} />
    </Field>
  )
}

export function QuoteExpiryField({
  register,
  errors,
  className,
}: {
  register: UseFormRegister<QuoteFormValues>
  errors: FieldErrors<QuoteFormValues>
  className?: string
}) {
  return (
    <Field
      className={cn(className)}
      data-invalid={!!errors.expiryAt || undefined}
    >
      <FieldLabel htmlFor="expiryAt">Expires</FieldLabel>
      <Input
        id="expiryAt"
        type="date"
        aria-invalid={!!errors.expiryAt}
        {...register("expiryAt")}
      />
      <FieldError errors={[errors.expiryAt]} />
    </Field>
  )
}
