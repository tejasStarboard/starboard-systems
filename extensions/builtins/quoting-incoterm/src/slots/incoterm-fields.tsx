"use client"

import { Controller } from "react-hook-form"

import {
  customerRoleSchema,
  oceanIncotermSchema,
} from "@starboard/lib-contracts"
import type {
  HeaderFieldsSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"
import { cn } from "@starboard/lib-ui/lib/utils"

/**
 * `quoting.incoterm.fields` → `quoting.slots.headerFields`.
 * Incoterm + Role selects; fragment so a `contents` slot host can place each
 * field as its own flex/grid child (desktop / tablet / mobile).
 */
export function IncotermFields({
  control,
  commercialEditable,
  layout,
}: SlotComponentProps<HeaderFieldsSlotProps>) {
  const disabled = !commercialEditable
  const incotermClass = layout === "desktop" ? "w-[6.5rem] shrink-0" : "w-full"
  const roleClass = layout === "desktop" ? "w-[8.5rem] shrink-0" : "w-full"
  return (
    <>
      <Controller
        control={control}
        name="incoterm"
        render={({ field, fieldState }) => (
          <Field
            className={cn(incotermClass)}
            data-invalid={fieldState.invalid || undefined}
          >
            <FieldLabel>Incoterm</FieldLabel>
            <Select
              value={field.value || null}
              disabled={disabled}
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
                {oceanIncotermSchema.options.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="customerRole"
        render={({ field, fieldState }) => (
          <Field
            className={cn(roleClass)}
            data-invalid={fieldState.invalid || undefined}
          >
            <FieldLabel>Role</FieldLabel>
            <Select
              value={field.value}
              disabled={disabled}
              onValueChange={(value) => {
                if (value === "shipper" || value === "consignee") {
                  field.onChange(value)
                }
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customerRoleSchema.options.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role === "shipper" ? "Shipper" : "Consignee"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </>
  )
}
