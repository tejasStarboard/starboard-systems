import { Suspense } from "react"

import { InvitationForm } from "@/components/auth/invitation-form"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"

export default function InvitationPage() {
  return (
    <Suspense fallback={<LoadingState size="sm">Loading…</LoadingState>}>
      <InvitationForm />
    </Suspense>
  )
}
