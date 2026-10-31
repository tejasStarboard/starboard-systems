"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  OrgMultiCombobox,
  type OrgOption,
} from "@/components/admin/org-multi-combobox"
import { Button } from "@starboard/lib-ui/components/button"
import type { RolloutMode } from "@starboard/ext-host"

export type ExtensionRolloutRow = {
  id: string
  displayName: string
  enabled: boolean
  requiredPlan: string[]
  mode: RolloutMode
  organizations: OrgOption[]
}

export function ExtensionRolloutPanel({
  extensions,
}: {
  extensions: ExtensionRolloutRow[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(extensions)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function save(row: ExtensionRolloutRow) {
    setPendingId(row.id)
    setError(null)
    try {
      const organizationIds =
        row.mode === "beta" ? row.organizations.map((org) => org.id) : []
      const response = await fetch("/api/admin/extensions/rollout", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          extensionId: row.id,
          mode: row.mode,
          organizationIds,
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? "Failed to save rollout")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <ul className="divide-y divide-border border">
        {rows.map((row) => (
          <li key={row.id} className="space-y-3 px-4 py-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{row.displayName}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {row.id}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Manifest: {row.enabled ? "enabled" : "disabled"} · Plans:{" "}
                {row.requiredPlan.join(", ")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className="h-9 border bg-background px-2 text-sm"
                  value={row.mode}
                  onChange={(event) => {
                    const mode = event.target.value as RolloutMode
                    setRows((current) =>
                      current.map((item) =>
                        item.id === row.id ? { ...item, mode } : item
                      )
                    )
                  }}
                >
                  <option value="off">Off</option>
                  <option value="common">Common beta list</option>
                  <option value="beta">Custom beta list</option>
                  <option value="on">On for all entitled</option>
                </select>
                <Button
                  type="button"
                  size="sm"
                  disabled={pendingId === row.id}
                  onClick={() => void save(row)}
                >
                  Save
                </Button>
              </div>
              {row.mode === "beta" ? (
                <OrgMultiCombobox
                  value={row.organizations}
                  onChange={(organizations) => {
                    setRows((current) =>
                      current.map((item) =>
                        item.id === row.id ? { ...item, organizations } : item
                      )
                    )
                  }}
                />
              ) : null}
              {row.mode === "common" ? (
                <p className="text-xs text-muted-foreground">
                  Uses the shared list from Admin → Settings.
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
