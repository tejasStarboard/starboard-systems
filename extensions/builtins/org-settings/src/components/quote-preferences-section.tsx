"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { CurrencyCombobox } from "@starboard/ext-geo-gazetteer"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import { toast } from "@starboard/lib-ui/components/toast"

import { authClient } from "../lib/auth-client"
import { toastFormErrors } from "../lib/form-toast"
import {
  parseOrgMetadata,
  type OrgWorkspaceMetadata,
} from "../lib/org-metadata"
import {
  quotePreferencesFormSchema,
  type QuotePreferencesFormValues,
} from "../lib/settings-forms.schema"

/**
 * Preferences → Quote (former Quote rules): org-level defaults stored in
 * `organization.metadata.quoteRules` — validity days + default base currency
 * applied to new / blank-currency quote drafts.
 */
export function QuotePreferencesSection() {
  const [metadata, setMetadata] = useState<OrgWorkspaceMetadata>({})
  const [loading, setLoading] = useState(true)
  const form = useForm<QuotePreferencesFormValues>({
    resolver: zodResolver(quotePreferencesFormSchema),
    defaultValues: { defaultValidityDays: "30", defaultBaseCurrency: "" },
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: orgError } =
      await authClient.organization.getFullOrganization()
    if (orgError || !data) {
      toast.add({
        type: "error",
        title: "Unable to load quote preferences",
        description: orgError?.message ?? "Something went wrong. Try again.",
      })
      setLoading(false)
      return
    }
    const parsed = parseOrgMetadata(data.metadata)
    setMetadata(parsed)
    form.reset({
      defaultValidityDays: String(parsed.quoteRules?.defaultValidityDays ?? 30),
      defaultBaseCurrency: parsed.quoteRules?.defaultBaseCurrency ?? "",
    })
    setLoading(false)
  }, [form])

  useEffect(() => {
    void load()
  }, [load])

  async function onSave(values: QuotePreferencesFormValues) {
    const next: OrgWorkspaceMetadata = {
      ...metadata,
      quoteRules: {
        defaultValidityDays: Number.parseInt(values.defaultValidityDays, 10),
        defaultBaseCurrency: values.defaultBaseCurrency
          ? values.defaultBaseCurrency.toUpperCase()
          : undefined,
      },
    }
    const { error: updateError } = await authClient.organization.update({
      data: { metadata: next },
    })
    if (updateError) {
      toast.add({
        type: "error",
        title: "Unable to save quote preferences",
        description: updateError.message ?? "Something went wrong. Try again.",
      })
      return
    }
    setMetadata(next)
    form.reset(values)
    toast.add({ type: "success", title: "Quote preferences saved" })
  }

  return (
    <section
      id="quote"
      aria-labelledby="preferences-quote-heading"
      className="scroll-mt-6 space-y-4"
    >
      <div className="space-y-1">
        <h2
          id="preferences-quote-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Quote
        </h2>
        <p className="text-sm text-muted-foreground">
          Workspace defaults applied when building quotes.
        </p>
      </div>

      {loading ? (
        <LoadingState size="sm">Loading preferences…</LoadingState>
      ) : (
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSave, toastFormErrors)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="defaultValidityDays"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="default-validity">
                    Default validity (days)
                  </FieldLabel>
                  <Input
                    id="default-validity"
                    type="number"
                    min={1}
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="defaultBaseCurrency"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="default-base-currency">
                    Default base currency
                  </FieldLabel>
                  <CurrencyCombobox
                    id="default-base-currency"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Quotes are totalled in this currency. New quotes start with
                    it; each quote can still change it in Basics.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            {form.formState.isSubmitting ? "Saving…" : "Save"}
          </Button>
        </form>
      )}
    </section>
  )
}
