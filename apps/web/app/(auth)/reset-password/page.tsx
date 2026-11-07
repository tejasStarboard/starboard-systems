import { Suspense } from "react"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState size="sm">Loading…</LoadingState>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
