"use client"

import { PlusIcon } from "@phosphor-icons/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import type { Rate } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@starboard/lib-ui/components/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { toast } from "@starboard/lib-ui/components/toast"
import { cn } from "@starboard/lib-ui/lib/utils"

import type { BuiltinHost } from "../host"
import { toastFormErrors } from "../lib/form-toast"
import {
  defaultRateFormValues,
  rateFormSchema,
  rateFormToPayload,
  type RateFormValues,
} from "../lib/rate-forms.schema"
import {
  IngestActionsSlot,
  RATES_INGEST_ACTIONS_POINT,
} from "../slots/ingest-actions"

export function RatesList({ host }: { host: BuiltinHost }) {
  const [query, setQuery] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [includeInactive, setIncludeInactive] = useState(false)
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)

  const createForm = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    defaultValues: defaultRateFormValues(),
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(query.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedQ) params.set("q", debouncedQ)
        if (includeInactive) params.set("includeInactive", "true")
        const qs = params.toString()
        const response = await fetch(qs ? `/api/rates?${qs}` : "/api/rates")
        const body = (await response.json().catch(() => null)) as {
          rates?: Rate[]
          error?: string
        } | null
        if (!response.ok || !body?.rates) {
          if (!cancelled) {
            toast.add({
              type: "error",
              title: "Unable to load rates",
              description: body?.error ?? "Something went wrong. Try again.",
            })
          }
          return
        }
        if (!cancelled) setRates(body.rates)
      } catch {
        if (!cancelled) {
          toast.add({
            type: "error",
            title: "Unable to load rates",
            description: "Something went wrong. Try again.",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [debouncedQ, includeInactive, reload])

  const rows = useMemo(() => rates, [rates])

  async function onCreate(values: RateFormValues) {
    try {
      const response = await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rateFormToPayload(values)),
      })
      const body = (await response.json().catch(() => null)) as
        (Rate & { error?: string }) | null
      if (!response.ok || !body?.id) {
        toast.add({
          type: "error",
          title: "Unable to create rate",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      createForm.reset(defaultRateFormValues())
      setDialogOpen(false)
      setReload((n) => n + 1)
      host.openEditor({
        viewType: "rate",
        resourceId: body.id,
        title: body.label,
      })
    } catch {
      toast.add({
        type: "error",
        title: "Unable to create rate",
        description: "Something went wrong. Try again.",
      })
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-sm font-medium">Rate catalog</h1>
        <div className="ml-auto flex items-center gap-2">
          <IngestActionsSlot
            contributions={host.slots?.[RATES_INGEST_ACTIONS_POINT] ?? []}
            pointComponents={host.pointComponents ?? {}}
            host={host}
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            Show inactive
          </label>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) createForm.reset(defaultRateFormValues())
            }}
          >
            <DialogTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Add rate"
                />
              }
            >
              <PlusIcon className="size-4" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form
                onSubmit={createForm.handleSubmit(onCreate, toastFormErrors)}
                className="flex flex-col gap-4"
              >
                <DialogHeader>
                  <DialogTitle>New catalog rate</DialogTitle>
                  <DialogDescription>
                    Manual rate stored in the org catalog.
                  </DialogDescription>
                </DialogHeader>
                <RateFormFields form={createForm} />
                <DialogFooter>
                  <Button type="submit" size="sm">
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search label or carrier"
        aria-label="Search rates"
        className="max-w-sm"
      />

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading rates…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rates found.</p>
      ) : (
        <ul className="divide-y border-y">
          {rows.map((rate) => {
            const active =
              host.activeEditor?.viewType === "rate" &&
              host.activeEditor.resourceId === rate.id
            return (
              <li key={rate.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-1 py-2.5 text-left text-sm hover:bg-muted/50",
                    active && "bg-muted"
                  )}
                  onClick={() =>
                    host.openEditor({
                      viewType: "rate",
                      resourceId: rate.id,
                      title: rate.label,
                    })
                  }
                >
                  <span className="flex items-center gap-2 font-medium">
                    {rate.label}
                    {!rate.isActive ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        inactive
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[rate.origin, rate.destination]
                      .filter(Boolean)
                      .join(" → ") || "No lane"}
                    {" · "}
                    {rate.currencyCode} {rate.amount}
                    {rate.carrier ? ` · ${rate.carrier}` : ""}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function RateFormFields({
  form,
}: {
  form: ReturnType<typeof useForm<RateFormValues>>
}) {
  return (
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
              <FieldLabel htmlFor={`rate-${name}`}>{label}</FieldLabel>
              <Input
                id={`rate-${name}`}
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
  )
}
