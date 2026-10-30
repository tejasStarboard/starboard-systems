import { Suspense } from "react"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-xs">Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
