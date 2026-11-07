import { Suspense } from "react"

import { LoginForm } from "@/components/auth/login-form"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState size="sm">Loading…</LoadingState>}>
      <LoginForm />
    </Suspense>
  )
}
