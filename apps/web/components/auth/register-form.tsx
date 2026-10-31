"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState } from "react"
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
import { toast } from "@starboard/lib-ui/components/toast"

import { GoogleButton } from "@/components/auth/google-button"
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/lib/domain/auth/auth-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"
import { authClient } from "@/lib/auth-client"

export function RegisterForm() {
  const [success, setSuccess] = useState(false)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  async function onSubmit(values: RegisterFormValues) {
    const { error: signUpError } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/select-org",
    })

    if (signUpError) {
      toast.add({
        type: "error",
        title: "Unable to create account",
        description: signUpError.message ?? "Something went wrong. Try again.",
      })
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-sm font-medium">Check your email</h1>
          <p className="text-xs text-muted-foreground">
            We sent a verification link. Verify your email before signing in.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-8 w-full items-center justify-center border border-border bg-background text-xs font-medium hover:bg-muted"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Create account</h1>
        <p className="text-xs text-muted-foreground">
          Sign up with Google or email and password.
        </p>
      </div>

      <GoogleButton label="Sign up with Google" />
      <FieldSeparator>or</FieldSeparator>

      <form
        onSubmit={form.handleSubmit(onSubmit, toastFormErrors)}
        className="flex flex-col gap-4"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
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
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
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
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Creating account..."
            : "Create account"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
