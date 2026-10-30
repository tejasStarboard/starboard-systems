import { Suspense } from "react"

import { InvitationForm } from "@/components/auth/invitation-form"

export default function InvitationPage() {
  return (
    <Suspense
      fallback={<p className="text-xs text-muted-foreground">Loading...</p>}
    >
      <InvitationForm />
    </Suspense>
  )
}
