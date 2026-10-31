"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  OrgMultiCombobox,
  type OrgOption,
} from "@/components/admin/org-multi-combobox"
import { Button } from "@starboard/lib-ui/components/button"
import { toast } from "@starboard/lib-ui/components/toast"

export function CommonBetaSettingsPanel({
  initialOrganizations,
}: {
  initialOrganizations: OrgOption[]
}) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [pending, setPending] = useState(false)

  async function save() {
    setPending(true)
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
      toast.add({ type: "success", title: "Common beta list saved" })
      router.refresh()
    } catch (err) {
      toast.add({
        type: "error",
        title: "Unable to save",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
      })
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
      <Button type="button" disabled={pending} onClick={() => void save()}>
        Save common beta list
      </Button>
    </div>
  )
}
