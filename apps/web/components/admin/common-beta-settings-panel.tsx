"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  OrgMultiCombobox,
  type OrgOption,
} from "@/components/admin/org-multi-combobox"
import { Button } from "@workspace/ui/components/button"

export function CommonBetaSettingsPanel({
  initialOrganizations,
}: {
  initialOrganizations: OrgOption[]
}) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save() {
    setPending(true)
    setError(null)
    setSaved(false)
    try {
      const response = await fetch("/api/admin/settings/common-beta", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationIds: organizations.map((org) => org.id),
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? "Failed to save common beta list")
      }
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <OrgMultiCombobox
        value={organizations}
        onChange={setOrganizations}
        placeholder="Search organizations by name…"
      />
      <div className="flex items-center gap-3">
        <Button type="button" disabled={pending} onClick={() => void save()}>
          Save common beta list
        </Button>
        {saved ? <p className="text-xs text-muted-foreground">Saved.</p> : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
