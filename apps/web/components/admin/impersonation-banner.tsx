"use client"

import { Button } from "@starboard/lib-ui/components/button"

import { useImpersonation } from "@/hooks/use-impersonation"

export function ImpersonationBanner({
  organizationName,
}: {
  organizationName: string
}) {
  const { pending, exit } = useImpersonation()

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
