"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { toast } from "@starboard/lib-ui/components/toast"

import { authClient } from "@/lib/auth-client"
import {
  parseOrgMetadata,
  type OrgWorkspaceMetadata,
} from "@/lib/domain/organizations/org-metadata"
import {
  quoteRulesFormSchema,
  type QuoteRulesFormValues,
} from "@/lib/domain/settings/settings-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"

export function QuoteRulesSettingsForm() {
  const [metadata, setMetadata] = useState<OrgWorkspaceMetadata>({})
  const [loading, setLoading] = useState(true)
  const form = useForm<QuoteRulesFormValues>({
    resolver: zodResolver(quoteRulesFormSchema),
    defaultValues: { defaultValidityDays: "30" },
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: orgError } =
      await authClient.organization.getFullOrganization()
    if (orgError || !data) {
      toast.add({
        type: "error",
        title: "Unable to load quote rules",
        description: orgError?.message ?? "Something went wrong. Try again.",
      })
      setLoading(false)
      return
    }
    const parsed = parseOrgMetadata(data.metadata)
    setMetadata(parsed)
    form.reset({
      defaultValidityDays: String(parsed.quoteRules?.defaultValidityDays ?? 30),
    })
    setLoading(false)
  }, [form])

  useEffect(() => {
    void load()
  }, [load])

  async function onSave(values: QuoteRulesFormValues) {
    const days = Number.parseInt(values.defaultValidityDays, 10)
    const next: OrgWorkspaceMetadata = {
      ...metadata,
      quoteRules: { defaultValidityDays: days },
    }
    const { error: updateError } = await authClient.organization.update({
      data: {
        metadata: next,
      },
    })
    if (updateError) {
      toast.add({
        type: "error",
        title: "Unable to save quote rules",
        description: updateError.message ?? "Something went wrong. Try again.",
      })
      return
    }
    setMetadata(next)
    form.reset(values)
    toast.add({ type: "success", title: "Quote rules saved" })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Quote rules</h1>
        <p className="text-sm text-muted-foreground">
          Defaults applied when building quotes for this workspace.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
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
          </FieldGroup>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            {form.formState.isSubmitting ? "Saving…" : "Save"}
          </Button>
        </form>
      )}
    </div>
  )
}
