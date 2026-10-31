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
import {
  parseOrgMetadata,
  type OrgWorkspaceMetadata,
} from "@/lib/domain/organizations/org-metadata"

export function QuoteRulesSettingsForm() {
  const [days, setDays] = useState("30")
  const [metadata, setMetadata] = useState<OrgWorkspaceMetadata>({})
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
      setError(orgError?.message ?? "Failed to load quote rules")
      setLoading(false)
      return
    }
    const parsed = parseOrgMetadata(data.metadata)
    setMetadata(parsed)
    setDays(String(parsed.quoteRules?.defaultValidityDays ?? 30))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    const parsedDays = Number.parseInt(days, 10)
    if (!Number.isFinite(parsedDays) || parsedDays < 1 || saving) {
      setError("Enter a validity of at least 1 day")
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    const next: OrgWorkspaceMetadata = {
      ...metadata,
      quoteRules: { defaultValidityDays: parsedDays },
    }
    const { error: updateError } = await authClient.organization.update({
      data: {
        metadata: next,
      },
    })
    setSaving(false)
    if (updateError) {
      setError(updateError.message ?? "Failed to save quote rules")
      return
    }
    setMetadata(next)
    setMessage("Quote rules saved")
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Quote rules</h1>
        <p className="text-sm text-muted-foreground">
          Defaults applied when building quotes for this workspace.
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
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="default-validity">
                Default validity (days)
              </FieldLabel>
              <Input
                id="default-validity"
                type="number"
                min={1}
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </section>
      )}
    </div>
  )
}
