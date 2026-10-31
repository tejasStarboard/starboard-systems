"use client"

import { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@starboard/lib-ui/components/alert"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"

import { authClient, useSession } from "@/lib/auth-client"

export function ProfileSettingsForm() {
  const { data: session, isPending } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "")
      setEmail(session.user.email ?? "")
    }
  }, [session])

  async function save() {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setError(null)
    setMessage(null)
    const { error: updateError } = await authClient.updateUser({
      name: trimmed,
    })
    setSaving(false)
    if (updateError) {
      setError(updateError.message ?? "Failed to update profile")
      return
    }
    setMessage("Profile saved")
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your name and account email.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input id="profile-email" value={email} disabled readOnly />
            </Field>
          </FieldGroup>
          <Button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </section>
      )}
    </div>
  )
}
