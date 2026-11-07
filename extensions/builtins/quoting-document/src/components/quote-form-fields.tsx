"use client"

import { CopyIcon } from "@phosphor-icons/react"
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { Spinner } from "@starboard/lib-ui/components/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"
import { toast } from "@starboard/lib-ui/components/toast"
import { cn } from "@starboard/lib-ui/lib/utils"

import { CustomerCombobox } from "@starboard/ext-crm-parties"
import { CurrencyCombobox } from "@starboard/ext-geo-gazetteer"
import type { LiveFxState } from "../lib/use-live-fx"
import { quoteStatusLabel } from "../lib/quote-stage"
import {
  quoteStatusSchema,
  type QuoteFormOption,
  type QuoteFormValues,
} from "../lib/quotes.schema"

const quoteStatusOptions = quoteStatusSchema.options

export function QuoteIdField({
  quoteId,
  className,
}: {
  quoteId: string
  className?: string
}) {
  return (
    <Field className={cn("gap-1", className)}>
      <FieldLabel className="text-[11px] text-muted-foreground">
        Quote ID
      </FieldLabel>
      <div className="flex h-7 items-center gap-1">
        <p className="text-xs font-medium tabular-nums">{quoteId}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Copy quote ID"
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
    </Field>
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
          className={cn("gap-1", className)}
          data-invalid={fieldState.invalid || undefined}
        >
          <FieldLabel className="text-[11px] text-muted-foreground">
            Status
          </FieldLabel>
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
              size="sm"
              className="w-full"
              aria-invalid={fieldState.invalid}
            >
              <SelectValue>{quoteStatusLabel(field.value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {quoteStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {quoteStatusLabel(status)}
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
  disabled,
}: {
  control: Control<QuoteFormValues>
  customerOptions: QuoteFormOption[]
  className?: string
  disabled?: boolean
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
            disabled={disabled}
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
  fx,
  className,
  disabled,
}: {
  control: Control<QuoteFormValues>
  currencyOptions: QuoteFormOption[]
  fx?: LiveFxState
  className?: string
  disabled?: boolean
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
          <FieldLabel htmlFor="quote-base-currency">Base currency</FieldLabel>
          <CurrencyCombobox
            id="quote-base-currency"
            options={currencyOptions}
            value={field.value}
            onChange={field.onChange}
            invalid={fieldState.invalid}
            disabled={disabled}
          />
          {fx && !disabled && field.value ? <FxStatusNote fx={fx} /> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function FxStatusNote({ fx }: { fx: LiveFxState }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      {fx.status === "loading" ? (
        <span className="inline-flex items-center gap-1.5">
          <Spinner className="size-3.5 text-muted-foreground" />
          Loading live FX…
        </span>
      ) : (
        <span>
          {fx.status === "error"
            ? "Live FX unavailable — existing rates kept."
            : fx.asOf
              ? `FX rates as of ${fx.asOf} (Frankfurter / ECB).`
              : "Totals convert charge lines into this currency."}
        </span>
      )}
      <Button
        type="button"
        variant="link"
        size="xs"
        className="h-auto px-0"
        disabled={fx.status === "loading"}
        onClick={fx.refresh}
      >
        Refresh
      </Button>
    </p>
  )
}

export function QuoteEffectiveField({
  register,
  errors,
  className,
  disabled,
}: {
  register: UseFormRegister<QuoteFormValues>
  errors: FieldErrors<QuoteFormValues>
  className?: string
  disabled?: boolean
}) {
  return (
    <Field
      className={cn("gap-1", className)}
      data-invalid={!!errors.effectiveFrom || undefined}
    >
      <FieldLabel
        htmlFor="effectiveFrom"
        className="text-[11px] text-muted-foreground"
      >
        Effective
      </FieldLabel>
      <Input
        id="effectiveFrom"
        type="date"
        className="h-7"
        disabled={disabled}
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
  disabled,
}: {
  register: UseFormRegister<QuoteFormValues>
  errors: FieldErrors<QuoteFormValues>
  className?: string
  disabled?: boolean
}) {
  return (
    <Field
      className={cn("gap-1", className)}
      data-invalid={!!errors.expiryAt || undefined}
    >
      <FieldLabel
        htmlFor="expiryAt"
        className="text-[11px] text-muted-foreground"
      >
        Expires
      </FieldLabel>
      <Input
        id="expiryAt"
        type="date"
        className="h-7"
        disabled={disabled}
        aria-invalid={!!errors.expiryAt}
        {...register("expiryAt")}
      />
      <FieldError errors={[errors.expiryAt]} />
    </Field>
  )
}
