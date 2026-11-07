"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import type { Rate } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@starboard/lib-ui/components/button-group"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { toast } from "@starboard/lib-ui/components/toast"

import type { BuiltinHost } from "../host"
import { toastFormErrors } from "../lib/form-toast"
import {
  rateFormSchema,
  rateFormToPayload,
  type RateFormValues,
} from "../lib/rate-forms.schema"

function toFormValues(rate: Rate): RateFormValues {
  return {
    label: rate.label,
    origin: rate.origin ?? "",
    destination: rate.destination ?? "",
    customerId: rate.customerId ?? "",
    mode: rate.mode,
    carrier: rate.carrier ?? "",
    currencyCode: rate.currencyCode,
    amount: rate.amount,
    validFrom: rate.validFrom.slice(0, 10),
    validTo: rate.validTo.slice(0, 10),
  }
}

export function RateDetail({
  rate,
  host,
  onChanged,
}: {
  rate: Rate
  host: BuiltinHost
  onChanged: (next: Rate | null) => void
}) {
  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    defaultValues: toFormValues(rate),
  })

  async function onSave(values: RateFormValues) {
    const payload = rateFormToPayload(values)
    const { source: _source, ...patch } = payload
    try {
      const response = await fetch(
        `/api/rates/${encodeURIComponent(rate.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      )
      const body = (await response.json().catch(() => null)) as
        (Rate & { error?: string }) | null
      if (!response.ok || !body?.id) {
        toast.add({
          type: "error",
          title: "Unable to save rate",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      toast.add({ type: "success", title: "Rate saved" })
      onChanged(body)
      form.reset(toFormValues(body))
    } catch {
      toast.add({
        type: "error",
        title: "Unable to save rate",
        description: "Something went wrong. Try again.",
      })
    }
  }

  async function setActive(isActive: boolean) {
    try {
      const response = await fetch(
        `/api/rates/${encodeURIComponent(rate.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        }
      )
      const body = (await response.json().catch(() => null)) as
        (Rate & { error?: string }) | null
      if (!response.ok || !body?.id) {
        toast.add({
          type: "error",
          title: isActive ? "Unable to reactivate" : "Unable to deactivate",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      toast.add({
        type: "success",
        title: isActive ? "Rate reactivated" : "Rate deactivated",
      })
      onChanged(body)
    } catch {
      toast.add({
        type: "error",
        title: isActive ? "Unable to reactivate" : "Unable to deactivate",
        description: "Something went wrong. Try again.",
      })
    }
  }

  async function onHardDelete() {
    if (
      !window.confirm("Permanently delete this rate? This cannot be undone.")
    ) {
      return
    }
    try {
      const response = await fetch(
        `/api/rates/${encodeURIComponent(rate.id)}`,
        { method: "DELETE" }
      )
      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        toast.add({
          type: "error",
          title: "Unable to delete rate",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      toast.add({ type: "success", title: "Rate deleted" })
      onChanged(null)
      host.openEditor({
        viewType: "rate.sheets",
        resourceId: "/rates/sheets",
        title: "Rate Sheets",
      })
    } catch {
      toast.add({
        type: "error",
        title: "Unable to delete rate",
        description: "Something went wrong. Try again.",
      })
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-sm font-medium">{rate.label}</h1>
        {!rate.isActive ? (
          <span className="text-xs text-muted-foreground">inactive</span>
        ) : null}
        <ButtonGroup aria-label="Rate lifecycle" className="ml-auto">
          {rate.isActive ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void setActive(false)}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void setActive(true)}
            >
              Reactivate
            </Button>
          )}
          <ButtonGroupSeparator />
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => void onHardDelete()}
          >
            Delete permanently
          </Button>
        </ButtonGroup>
      </div>

      <form
        onSubmit={form.handleSubmit(onSave, toastFormErrors)}
        className="flex max-w-md flex-col gap-4"
      >
        <FieldGroup>
          {(
            [
              ["label", "Label"],
              ["origin", "Origin"],
              ["destination", "Destination"],
              ["carrier", "Carrier"],
              ["currencyCode", "Currency"],
              ["amount", "Amount"],
              ["validFrom", "Valid from"],
              ["validTo", "Valid to"],
            ] as const
          ).map(([name, label]) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={`edit-rate-${name}`}>{label}</FieldLabel>
                  <Input
                    id={`edit-rate-${name}`}
                    type={
                      name === "amount"
                        ? "number"
                        : name === "validFrom" || name === "validTo"
                          ? "date"
                          : "text"
                    }
                    step={name === "amount" ? "any" : undefined}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      if (name === "amount") {
                        field.onChange(
                          event.target.value === ""
                            ? Number.NaN
                            : Number(event.target.value)
                        )
                        return
                      }
                      field.onChange(event.target.value)
                    }}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />
          ))}
        </FieldGroup>
        <Button type="submit" size="sm" className="w-fit">
          Save
        </Button>
      </form>
    </div>
  )
}
