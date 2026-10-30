"use client"

import { GoogleLogo } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"

type GoogleButtonProps = {
  callbackURL?: string
  label?: string
}

export function GoogleButton({
  callbackURL = "/select-org",
  label = "Continue with Google",
}: GoogleButtonProps) {
  const [pending, setPending] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        await authClient.signIn.social({
          provider: "google",
          callbackURL,
        })
      }}
    >
      <GoogleLogo data-icon="inline-start" />
      {label}
    </Button>
  )
}
