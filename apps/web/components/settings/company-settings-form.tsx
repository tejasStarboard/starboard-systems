"use client"

import { useCallback, useEffect, useState } from "react"

import { Alert, AlertDescription } from "@starboard/lib-ui/components/alert"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"

import { authClient } from "@/lib/auth-client"

export function CompanySettingsForm() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: orgError } =
      await authClient.organization.getFullOrganization()
    if (orgError || !data) {
      setError(orgError?.message ?? "Failed to load company")
      setLoading(false)
      return
    }
    setName(data.name)
    setSlug(data.slug)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    const trimmedName = name.trim()
    const trimmedSlug = slug.trim()
    if (!trimmedName || !trimmedSlug || saving) return
    setSaving(true)
    setError(null)
    setMessage(null)
    const { error: updateError } = await authClient.organization.update({
      data: {
        name: trimmedName,
        slug: trimmedSlug,
      },
    })
    setSaving(false)
    if (updateError) {
      setError(updateError.message ?? "Failed to save company")
      return
    }
    setMessage("Company saved")
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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="company-name">Name</FieldLabel>
              <Input
                id="company-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-slug">Slug</FieldLabel>
              <Input
                id="company-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <Button
            type="button"
            disabled={saving || !name.trim() || !slug.trim()}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </section>
      )}
    </div>
  )
}
