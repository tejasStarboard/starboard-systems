"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
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
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/domain/settings/settings-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"
import { authClient, useSession } from "@/lib/auth-client"

export function ProfileSettingsForm() {
  const { data: session, isPending } = useSession()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "", email: "" },
  })

  useEffect(() => {
    if (session?.user) {
      form.reset({
        name: session.user.name ?? "",
        email: session.user.email ?? "",
      })
    }
  }, [form, session])

  async function onSave(values: ProfileFormValues) {
    const { error: updateError } = await authClient.updateUser({
      name: values.name,
    })
    if (updateError) {
      toast.add({
        type: "error",
        title: "Unable to update profile",
        description: updateError.message ?? "Something went wrong. Try again.",
      })
      return
    }
    toast.add({ type: "success", title: "Profile saved" })
    form.reset(values)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your name and account email.
        </p>
      </div>

      {isPending ? (
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
                  <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                  <Input
                    id="profile-name"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                  <Input id="profile-email" {...field} disabled readOnly />
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
