import { Suspense } from "react"

import { InvitationForm } from "@/components/auth/invitation-form"

export default function InvitationPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-xs">Loading...</p>}>
      <InvitationForm />
    </Suspense>
  )
}
