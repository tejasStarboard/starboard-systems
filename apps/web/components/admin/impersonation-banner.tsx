"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@starboard/lib-ui/components/button"

export function ImpersonationBanner({
  organizationName,
}: {
  organizationName: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function exit() {
    setPending(true)
    try {
      await fetch("/api/admin/impersonation", { method: "DELETE" })
      router.push("/admin/organizations")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm">
      <p>
        Viewing as <span className="font-medium">{organizationName}</span>
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => void exit()}
      >
        Exit customer
      </Button>
    </div>
  )
}
