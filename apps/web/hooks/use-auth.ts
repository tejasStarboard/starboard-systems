"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

import { authClient, useSession } from "@/lib/auth-client"

function errorMessage(error: { message?: string | null } | null | undefined) {
  return error?.message ?? "Something went wrong. Try again."
}

export function useAuth() {
  const router = useRouter()
  const session = useSession()
  const [pending, setPending] = useState(false)

  const signInEmail = useCallback(
    async (input: {
      email: string
      password: string
      callbackURL?: string
    }) => {
      const callbackURL = input.callbackURL ?? "/select-org"
      const { error } = await authClient.signIn.email({
        email: input.email,
        password: input.password,
        callbackURL,
      })
      if (error) {
        toast.add({
          type: "error",
          title: "Unable to sign in",
          description: errorMessage(error),
        })
        return { ok: false as const }
      }
      router.push(callbackURL)
      router.refresh()
      return { ok: true as const }
    },
    [router]
  )

  const signUpEmail = useCallback(
    async (input: {
      name: string
      email: string
      password: string
      callbackURL?: string
    }) => {
      const { error } = await authClient.signUp.email({
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: input.callbackURL ?? "/select-org",
      })
      if (error) {
        toast.add({
          type: "error",
          title: "Unable to create account",
          description: errorMessage(error),
        })
        return { ok: false as const }
      }
      return { ok: true as const }
    },
    []
  )

  const signOut = useCallback(async () => {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }, [router])

  const signInGoogle = useCallback(async (callbackURL = "/select-org") => {
    setPending(true)
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      })
    } finally {
      setPending(false)
    }
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      toast.add({
        type: "error",
        title: "Unable to send reset email",
        description: errorMessage(error),
      })
      return { ok: false as const }
    }
    return { ok: true as const }
  }, [])

  const resetPassword = useCallback(
    async (input: { password: string; token: string }) => {
      const { error } = await authClient.resetPassword({
        newPassword: input.password,
        token: input.token,
      })
      if (error) {
        toast.add({
          type: "error",
          title: "Unable to reset password",
          description: errorMessage(error),
        })
        return { ok: false as const }
      }
      toast.add({ type: "success", title: "Password updated" })
      router.push("/login")
      router.refresh()
      return { ok: true as const }
    },
    [router]
  )

  return {
    session: session.data,
    sessionPending: session.isPending,
    pending,
    signInEmail,
    signUpEmail,
    signOut,
    signInGoogle,
    requestPasswordReset,
    resetPassword,
  }
}
