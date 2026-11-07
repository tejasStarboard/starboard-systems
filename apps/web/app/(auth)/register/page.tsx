import { Suspense } from "react"

import { RegisterForm } from "@/components/auth/register-form"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingState size="sm">Loading…</LoadingState>}>
      <RegisterForm />
    </Suspense>
  )
}
