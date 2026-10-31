"use client"

import { Buildings, Plus } from "@phosphor-icons/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { Spinner } from "@starboard/lib-ui/components/spinner"
import { toast } from "@starboard/lib-ui/components/toast"

import {
  createOrganizationFormSchema,
  type CreateOrganizationFormValues,
} from "@/lib/domain/auth/auth-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"
import { authClient } from "@/lib/auth-client"

type Organization = {
  id: string
  name: string
  slug: string
}

function toSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function SelectOrgForm() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [enteringId, setEnteringId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationFormSchema),
    defaultValues: { name: "", slug: "" },
  })

  const loadOrganizations = useCallback(async () => {
    setLoading(true)

    const { data, error: listError } = await authClient.organization.list()

    if (listError) {
      toast.add({
        type: "error",
        title: "Unable to load organizations",
        description: listError.message ?? "Something went wrong. Try again.",
      })
      setOrganizations([])
    } else {
      setOrganizations(data ?? [])
      if (!data?.length) {
        setShowCreate(true)
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  async function enterOrganization(organizationId: string) {
    setEnteringId(organizationId)

    const { error: activeError } = await authClient.organization.setActive({
      organizationId,
    })

    if (activeError) {
      setEnteringId(null)
      toast.add({
        type: "error",
        title: "Unable to enter organization",
        description: activeError.message ?? "Something went wrong. Try again.",
      })
      return
    }

    router.push("/")
    router.refresh()
  }

  async function onCreate(values: CreateOrganizationFormValues) {
    const { data, error: createError } = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
    })

    if (createError || !data) {
      toast.add({
        type: "error",
        title: "Unable to create organization",
        description: createError?.message ?? "Something went wrong. Try again.",
      })
      return
    }

    const { error: activeError } = await authClient.organization.setActive({
      organizationId: data.id,
    })

    if (activeError) {
      toast.add({
        type: "error",
        title: "Organization created",
        description:
          activeError.message ??
          "Created, but could not enter it. Try selecting it below.",
      })
      await loadOrganizations()
      return
    }

    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Spinner />
        <span className="text-xs text-muted-foreground">
          Loading organizations...
        </span>
      </div>
    )
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
            <button
              key={org.id}
              type="button"
              disabled={enteringId !== null}
              onClick={() => void enterOrganization(org.id)}
              className="flex w-full items-center gap-3 border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-50"
            >
              <span className="flex size-8 items-center justify-center bg-muted">
                <Buildings className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {org.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {org.slug}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {enteringId === org.id ? "Entering..." : "Enter"}
              </span>
            </button>
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

          <div className="flex gap-2">
            {organizations.length > 0 ? (
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
            ) : null}
            <Button
              type="submit"
              className="flex-1"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create and enter"}
            </Button>
          </div>
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
