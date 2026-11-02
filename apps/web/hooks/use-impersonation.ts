"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

export async function requestStartImpersonation(
  organizationId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch("/api/admin/impersonation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ organizationId }),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    return {
      ok: false,
      message: body?.error ?? "Could not switch organization",
    }
  }
  return { ok: true }
}

export async function requestExitImpersonation(): Promise<void> {
  await fetch("/api/admin/impersonation", { method: "DELETE" })
}

export function useImpersonation() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const start = useCallback(
    async (organizationId: string) => {
      setPending(true)
      try {
        const result = await requestStartImpersonation(organizationId)
        if (!result.ok) {
          toast.add({
            type: "error",
            title: "Unable to switch organization",
            description: result.message,
          })
          return { ok: false as const }
        }
        router.push("/")
        router.refresh()
        return { ok: true as const }
      } catch (err) {
        toast.add({
          type: "error",
          title: "Unable to switch organization",
          description:
            err instanceof Error
              ? err.message
              : "Something went wrong. Try again.",
        })
        return { ok: false as const }
      } finally {
        setPending(false)
      }
    },
    [router]
  )

  const exit = useCallback(
    async (redirectTo = "/admin/organizations") => {
      setPending(true)
      try {
        await requestExitImpersonation()
        router.push(redirectTo)
        router.refresh()
      } finally {
        setPending(false)
      }
    },
    [router]
  )

  return { pending, start, exit }
}
