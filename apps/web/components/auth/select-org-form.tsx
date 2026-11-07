"use client"

import { Buildings, Plus } from "@phosphor-icons/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

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
  FieldSeparator,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"

import { useOrganizations } from "@/hooks/use-organizations"
import {
  createOrganizationFormSchema,
  type CreateOrganizationFormValues,
} from "@/lib/domain/auth/auth-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"

function toSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function SelectOrgForm() {
  const {
    organizations,
    loading,
    enteringId,
    enterOrganization,
    createAndEnter,
  } = useOrganizations()
  const [showCreate, setShowCreate] = useState(false)

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationFormSchema),
    defaultValues: { name: "", slug: "" },
  })

  useEffect(() => {
    if (!loading && organizations.length === 0) {
      setShowCreate(true)
    }
  }, [loading, organizations.length])

  async function onCreate(values: CreateOrganizationFormValues) {
    await createAndEnter(values)
  }

  if (loading) {
    return <LoadingState>Loading organizations…</LoadingState>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Select organization</h1>
        <p className="text-xs text-muted-foreground">
          Choose an organization to continue, or create a new one.
        </p>
      </div>

      {organizations.length > 0 ? (
        <div className="flex flex-col gap-2">
          {organizations.map((org) => (
            <Button
              key={org.id}
              type="button"
              variant="outline"
              disabled={enteringId !== null}
              onClick={() => void enterOrganization(org.id)}
              className="h-auto w-full items-center justify-start gap-3 px-3 py-2.5 text-left"
            >
              <span className="flex size-8 items-center justify-center bg-muted">
                <Buildings className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {org.name}
                </span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {org.slug}
                </span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {enteringId === org.id ? "Entering..." : "Enter"}
              </span>
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          You don&apos;t belong to any organizations yet.
        </p>
      )}

      <FieldSeparator>or</FieldSeparator>

      {showCreate ? (
        <form
          onSubmit={form.handleSubmit(onCreate, toastFormErrors)}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
                  <Input
                    id="org-name"
                    placeholder="Acme Shipping"
                    autoComplete="organization"
                    aria-invalid={fieldState.invalid}
                    {...field}
                    onChange={(event) => {
                      const next = event.target.value
                      field.onChange(next)
                      if (!form.getFieldState("slug").isDirty) {
                        form.setValue("slug", toSlug(next), {
                          shouldValidate: true,
                        })
                      }
                    }}
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
                  <FieldLabel htmlFor="org-slug">Slug</FieldLabel>
                  <Input
                    id="org-slug"
                    placeholder="acme-shipping"
                    aria-invalid={fieldState.invalid}
                    {...field}
                    onChange={(event) => {
                      field.onChange(toSlug(event.target.value))
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <ButtonGroup aria-label="Create organization" className="w-full">
            {organizations.length > 0 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                  onClick={() => {
                    setShowCreate(false)
                    form.reset({ name: "", slug: "" })
                  }}
                >
                  Cancel
                </Button>
                <ButtonGroupSeparator />
              </>
            ) : null}
            <Button
              type="submit"
              className="flex-1"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create and enter"}
            </Button>
          </ButtonGroup>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowCreate(true)}
        >
          <Plus data-icon="inline-start" />
          Create organization
        </Button>
      )}
    </div>
  )
}
