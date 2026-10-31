"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@starboard/lib-ui/components/alert"
import { Button } from "@starboard/lib-ui/components/button"

import { authClient, useSession } from "@/lib/auth-client"

export function InvitationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationId = searchParams.get("invitationId")
  const { data: session, isPending: sessionPending } = useSession()

  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [loadingInvite, setLoadingInvite] = useState(true)

  useEffect(() => {
    if (!invitationId) {
      setLoadingInvite(false)
      return
    }

    let cancelled = false

    async function loadInvitation() {
      const { data, error: inviteError } =
        await authClient.organization.getInvitation({
          query: { id: invitationId! },
        })

      if (cancelled) return

      if (inviteError) {
        setError(inviteError.message ?? "Invitation not found")
      } else if (data) {
        setOrganizationName(data.organizationName)
      }

      setLoadingInvite(false)
    }

    void loadInvitation()

    return () => {
      cancelled = true
    }
  }, [invitationId])

  async function acceptInvitation() {
    if (!invitationId) return

    setPending(true)
    setError(null)

    const { error: acceptError } =
      await authClient.organization.acceptInvitation({
        invitationId,
      })

    setPending(false)

    if (acceptError) {
      setError(acceptError.message ?? "Unable to accept invitation")
      return
    }

    router.push("/select-org")
    router.refresh()
  }

  if (!invitationId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Missing invitation id.</AlertDescription>
      </Alert>
    )
  }

  if (loadingInvite || sessionPending) {
    return (
      <p className="text-xs text-muted-foreground">Loading invitation...</p>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-sm font-medium">Accept invitation</h1>
          <p className="text-xs text-muted-foreground">
            Sign in or create an account to join
            {organizationName ? ` ${organizationName}` : " this organization"}.
          </p>
        </div>
        <Button
          className="w-full"
          onClick={() =>
            router.push(
              `/login?next=${encodeURIComponent(`/invitation?invitationId=${invitationId}`)}`
            )
          }
        >
          Sign in to continue
        </Button>
        <Link
          href={`/register?next=${encodeURIComponent(`/invitation?invitationId=${invitationId}`)}`}
          className="text-center text-xs underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Join organization</h1>
        <p className="text-xs text-muted-foreground">
          You&apos;ve been invited to join{" "}
          {organizationName ? (
            <span className="font-medium text-foreground">
              {organizationName}
            </span>
          ) : (
            "an organization"
          )}
          .
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button className="w-full" disabled={pending} onClick={acceptInvitation}>
        {pending ? "Accepting..." : "Accept invitation"}
      </Button>
    </div>
  )
}
