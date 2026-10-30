import { Suspense } from "react"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<p className="text-xs text-muted-foreground">Loading...</p>}
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
