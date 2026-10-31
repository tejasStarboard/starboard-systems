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

import {
  companyFormSchema,
  type CompanyFormValues,
} from "@/lib/domain/settings/settings-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"
import { authClient } from "@/lib/auth-client"

export function CompanySettingsForm() {
  const [loading, setLoading] = useState(true)
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: { name: "", slug: "" },
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: orgError } =
      await authClient.organization.getFullOrganization()
    if (orgError || !data) {
      toast.add({
        type: "error",
        title: "Unable to load company",
        description: orgError?.message ?? "Something went wrong. Try again.",
      })
      setLoading(false)
      return
    }
    form.reset({ name: data.name, slug: data.slug })
    setLoading(false)
  }, [form])

  useEffect(() => {
    void load()
  }, [load])

  async function onSave(values: CompanyFormValues) {
    const { error: updateError } = await authClient.organization.update({
      data: {
        name: values.name,
        slug: values.slug,
      },
    })
    if (updateError) {
      toast.add({
        type: "error",
        title: "Unable to save company",
        description: updateError.message ?? "Something went wrong. Try again.",
      })
      return
    }
    toast.add({ type: "success", title: "Company saved" })
    form.reset(values)
    await load()
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Company</h1>
        <p className="text-sm text-muted-foreground">
          Workspace name and identifier for the active organization.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <form
          className="space-y-4 rounded-xl border bg-card p-4"
          onSubmit={form.handleSubmit(onSave, toastFormErrors)}
        >
          <FieldGroup className="gap-3">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="company-name">Name</FieldLabel>
                  <Input
                    id="company-name"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="slug"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="company-slug">Slug</FieldLabel>
                  <Input
                    id="company-slug"
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
