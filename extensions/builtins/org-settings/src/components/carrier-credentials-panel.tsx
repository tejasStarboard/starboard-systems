"use client"

import { useEffect, useState } from "react"

import { Button } from "@starboard/lib-ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@starboard/lib-ui/components/button-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@starboard/lib-ui/components/card"
import { Field, FieldLabel } from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import { toast } from "@starboard/lib-ui/components/toast"

import {
  carrierValidationMessage,
  type CarrierValidationStatus,
} from "../lib/carrier-credentials-form"

type CarrierSetting = {
  key: string
  label: string
  description?: string
  required: boolean
  configured?: boolean
}

type Carrier = {
  extensionId: string
  displayName: string
  settings: CarrierSetting[]
  validation: {
    status: CarrierValidationStatus
    validatedAt: string | null
    errorMessage: string | null
  }
}

export function CarrierCredentialsPanel() {
  const [carriers, setCarriers] = useState<Carrier[] | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>(
    {}
  )
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch("/api/settings/carrier-credentials", {
          signal: controller.signal,
        })
        const body = (await response.json().catch(() => null)) as {
          carriers?: Carrier[]
          error?: string
        } | null
        if (!response.ok) {
          setLoadError(body?.error ?? "Unable to load carrier credentials")
          return
        }
        setCarriers(body?.carriers ?? [])
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        setLoadError("Unable to load carrier credentials")
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  async function save(carrier: Carrier) {
    const values: Record<string, string> = {}
    for (const setting of carrier.settings) {
      const draft = drafts[carrier.extensionId]?.[setting.key]?.trim() ?? ""
      if (draft) {
        values[setting.key] = draft
      }
    }
    if (Object.keys(values).length === 0) {
      toast.add({
        type: "error",
        title: "Enter a credential to save",
      })
      return
    }
    await submit(carrier.extensionId, "/api/settings/carrier-credentials", {
      method: "PUT",
      values,
    })
  }

  async function revalidate(extensionId: string) {
    await submit(extensionId, "/api/settings/carrier-credentials/validate", {
      method: "POST",
    })
  }

  async function submit(
    extensionId: string,
    path: string,
    input: { method: "PUT" | "POST"; values?: Record<string, string> }
  ) {
    setValidatingId(extensionId)
    try {
      const response = await fetch(path, {
        method: input.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extensionId,
          ...(input.values ? { values: input.values } : {}),
        }),
      })
      const body = (await response.json().catch(() => null)) as {
        carrier?: Carrier
        error?: string
      } | null
      if (!response.ok || !body?.carrier) {
        toast.add({
          type: "error",
          title: "Unable to save credentials",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      setCarriers((current) =>
        (current ?? []).map((carrier) =>
          carrier.extensionId === extensionId ? body.carrier! : carrier
        )
      )
      setDrafts((current) => ({ ...current, [extensionId]: {} }))
      if (body.carrier.validation.status === "error") {
        toast.add({
          type: "error",
          title: "Validation failed",
          description:
            body.carrier.validation.errorMessage ?? "Validation failed",
        })
      }
    } finally {
      setValidatingId(null)
    }
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>
  }
  if (!carriers) {
    return <LoadingState size="sm">Loading credentials…</LoadingState>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Carrier credentials</h2>
        <p className="text-sm text-muted-foreground">
          Stored encrypted for this organization. A blank field keeps the saved
          secret. Environment JSON is a local development fallback only.
        </p>
      </div>
      {carriers.map((carrier) => {
        const validating = validatingId === carrier.extensionId
        return (
          <Card key={carrier.extensionId} size="sm">
            <CardHeader>
              <CardTitle>{carrier.displayName}</CardTitle>
              <CardDescription>
                {carrierValidationMessage({
                  validating,
                  status: carrier.validation.status,
                  errorMessage: carrier.validation.errorMessage,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
            {carrier.settings.map((setting) => (
              <Field key={setting.key} className="gap-1">
                <FieldLabel>
                  {setting.label}
                  {setting.configured ? " · configured" : ""}
                </FieldLabel>
                <Input
                  type="password"
                  autoComplete="off"
                  disabled={validating}
                  value={drafts[carrier.extensionId]?.[setting.key] ?? ""}
                  placeholder={setting.configured ? "Configured" : ""}
                  onChange={(event) => {
                    const value = event.target.value
                    setDrafts((current) => ({
                      ...current,
                      [carrier.extensionId]: {
                        ...current[carrier.extensionId],
                        [setting.key]: value,
                      },
                    }))
                  }}
                />
              </Field>
            ))}
            <ButtonGroup aria-label="Credential actions">
              <Button
                type="button"
                size="sm"
                disabled={validating}
                onClick={() => void save(carrier)}
              >
                {validating ? "Validating…" : "Save"}
              </Button>
              <ButtonGroupSeparator />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={validating}
                onClick={() => void revalidate(carrier.extensionId)}
              >
                Validate
              </Button>
            </ButtonGroup>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
