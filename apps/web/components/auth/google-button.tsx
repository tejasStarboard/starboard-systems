"use client"

import { GoogleLogo } from "@phosphor-icons/react"

import { Button } from "@starboard/lib-ui/components/button"

import { useAuth } from "@/hooks/use-auth"

type GoogleButtonProps = {
  callbackURL?: string
  label?: string
}

export function GoogleButton({
  callbackURL = "/select-org",
  label = "Continue with Google",
}: GoogleButtonProps) {
  const { pending, signInGoogle } = useAuth()

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={() => void signInGoogle(callbackURL)}
    >
      <GoogleLogo data-icon="inline-start" />
      {label}
    </Button>
  )
}
