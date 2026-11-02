import { Suspense } from "react"

import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<p className="text-xs text-muted-foreground">Loading...</p>}
    >
      <RegisterForm />
    </Suspense>
  )
}
