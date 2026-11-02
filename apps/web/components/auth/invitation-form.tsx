"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@starboard/lib-ui/components/button"

import { useAuth } from "@/hooks/use-auth"
import { useOrganizationInvitation } from "@/hooks/use-organizations"

export function InvitationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationId = searchParams.get("invitationId")
  const { session, sessionPending } = useAuth()
  const {
    organizationName,
    loadFailed,
    loadingInvite,
    pending,
    acceptInvitation,
  } = useOrganizationInvitation(invitationId)

  if (!invitationId) {
    return (
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Invalid invitation</h1>
        <p className="text-xs text-muted-foreground">Missing invitation id.</p>
      </div>
    )
  }

  if (loadingInvite || sessionPending) {
    return (
      <p className="text-xs text-muted-foreground">Loading invitation...</p>
    )
  }

  if (loadFailed) {
    return (
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Invitation unavailable</h1>
        <p className="text-xs text-muted-foreground">
          This invitation could not be loaded. Ask for a new invite link.
        </p>
      </div>
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

      <Button
        className="w-full"
        disabled={pending}
        onClick={() => void acceptInvitation()}
      >
        {pending ? "Accepting..." : "Accept invitation"}
      </Button>
    </div>
  )
}
