"use client"

import { CaretDown } from "@phosphor-icons/react"
import type { RolloutMode, StaffSettingView } from "@starboard/ext-host"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  OrgMultiCombobox,
  type OrgOption,
} from "@/components/admin/org-multi-combobox"
import {
  buildExtensionSettingValues,
  fieldsFromStaffSettings,
  type SettingFormField,
} from "@/lib/domain/platform/extension-settings-form"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@starboard/lib-ui/components/collapsible"
import { Input } from "@starboard/lib-ui/components/input"
import { Switch } from "@starboard/lib-ui/components/switch"

export type ExtensionRolloutRow = {
  id: string
  displayName: string
  enabled: boolean
  requiredPlan: string[]
  mode: RolloutMode
  organizations: OrgOption[]
}

const modeLabel: Record<RolloutMode, string> = {
  off: "Off",
  common: "Common beta list",
  beta: "Custom beta list",
  on: "On for all entitled",
}

type SettingsPayload = {
  extensions: Array<{
    extensionId: string
    settings: StaffSettingView[]
  }>
}

export function ExtensionRolloutPanel({
  extensions,
}: {
  extensions: ExtensionRolloutRow[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(extensions)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pendingSettingsId, setPendingSettingsId] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(
    null
  )
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [fieldsById, setFieldsById] = useState<
    Record<string, SettingFormField[]>
  >({})

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      setSettingsLoading(true)
      setSettingsLoadError(null)
      try {
        const response = await fetch("/api/admin/extensions/settings")
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(body?.error ?? "Failed to load settings")
        }
        const body = (await response.json()) as SettingsPayload
        if (cancelled) return
        const next: Record<string, SettingFormField[]> = {}
        for (const extension of body.extensions ?? []) {
          next[extension.extensionId] = fieldsFromStaffSettings(
            extension.settings ?? []
          )
        }
        setFieldsById(next)
      } catch (err) {
        if (!cancelled) {
          setSettingsLoadError(
            err instanceof Error ? err.message : "Failed to load settings"
          )
        }
      } finally {
        if (!cancelled) setSettingsLoading(false)
      }
    }

    void loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  async function saveRollout(row: ExtensionRolloutRow) {
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

  async function saveSettings(row: ExtensionRolloutRow) {
    const fields = fieldsById[row.id] ?? []
    const built = buildExtensionSettingValues(fields)
    if (!built.ok) {
      setSettingsError(built.message)
      return
    }

    setPendingSettingsId(row.id)
    setSettingsError(null)
    try {
      const response = await fetch("/api/admin/extensions/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          extensionId: row.id,
          values: built.values,
        }),
      })
      const body = (await response.json().catch(() => null)) as {
        error?: string
        settings?: StaffSettingView[]
      } | null
      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to save settings")
      }
      if (body?.settings) {
        setFieldsById((current) => ({
          ...current,
          [row.id]: fieldsFromStaffSettings(body.settings ?? []),
        }))
      }
      router.refresh()
    } catch (err) {
      setSettingsError(
        err instanceof Error ? err.message : "Failed to save settings"
      )
    } finally {
      setPendingSettingsId(null)
    }
  }

  function updateField(
    extensionId: string,
    key: string,
    patch: Partial<SettingFormField>
  ) {
    setFieldsById((current) => ({
      ...current,
      [extensionId]: (current[extensionId] ?? []).map((field) =>
        field.key === key ? { ...field, ...patch } : field
      ),
    }))
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {settingsLoadError ? (
        <p className="text-sm text-destructive">{settingsLoadError}</p>
      ) : null}
      <ul className="divide-y divide-border border">
        {rows.map((row) => {
          const open = openIds.has(row.id)
          const fields = fieldsById[row.id]
          return (
            <li key={row.id}>
              <Collapsible
                open={open}
                onOpenChange={(next) => {
                  setOpenIds((current) => {
                    const copy = new Set(current)
                    if (next) copy.add(row.id)
                    else copy.delete(row.id)
                    return copy
                  })
                }}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                  <div>
                    <p className="text-sm font-medium">{row.displayName}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {row.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">
                      Manifest: {row.enabled ? "enabled" : "disabled"} ·{" "}
                      {modeLabel[row.mode]}
                    </p>
                    <CaretDown
                      className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 px-4 pb-4">
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
                        onClick={() => void saveRollout(row)}
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
                              item.id === row.id
                                ? { ...item, organizations }
                                : item
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
                    <p className="text-xs text-muted-foreground">
                      Plans: {row.requiredPlan.join(", ")}
                    </p>
                  </div>

                  <div className="space-y-3 border-t pt-3">
                    <p className="text-xs font-medium">Settings</p>
                    {settingsLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Loading settings…
                      </p>
                    ) : settingsLoadError ? (
                      <p className="text-sm text-destructive">
                        {settingsLoadError}
                      </p>
                    ) : !fields || fields.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        This extension exposes no admin settings.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {fields.map((field) => (
                          <SettingControl
                            key={field.key}
                            field={field}
                            onChange={(patch) =>
                              updateField(row.id, field.key, patch)
                            }
                          />
                        ))}
                        {settingsError ? (
                          <p className="text-sm text-destructive">
                            {settingsError}
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          disabled={pendingSettingsId === row.id}
                          onClick={() => void saveSettings(row)}
                        >
                          Save settings
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SettingControl({
  field,
  onChange,
}: {
  field: SettingFormField
  onChange: (patch: Partial<SettingFormField>) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium">{field.label}</span>
      {field.description ? (
        <span className="text-xs text-muted-foreground">
          {field.description}
        </span>
      ) : null}
      {field.type === "boolean" ? (
        <Switch
          checked={field.booleanValue}
          onCheckedChange={(checked) =>
            onChange({ booleanValue: checked === true })
          }
        />
      ) : null}
      {field.type === "string" ? (
        <Input
          value={field.textValue}
          onChange={(event) => onChange({ textValue: event.target.value })}
        />
      ) : null}
      {field.type === "number" ? (
        <Input
          type="number"
          value={field.textValue}
          onChange={(event) => onChange({ textValue: event.target.value })}
        />
      ) : null}
      {field.type === "select" ? (
        <select
          className="h-9 border bg-background px-2 text-sm"
          value={field.textValue}
          onChange={(event) => onChange({ textValue: event.target.value })}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {field.type === "secret" ? (
        <Input
          type="password"
          value={field.textValue}
          placeholder={field.configured ? "••••" : undefined}
          onChange={(event) =>
            onChange({ textValue: event.target.value, secretDirty: true })
          }
        />
      ) : null}
    </div>
  )
}
