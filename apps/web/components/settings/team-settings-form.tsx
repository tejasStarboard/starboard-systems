"use client"

import { useCallback, useEffect, useState } from "react"

import { Alert, AlertDescription } from "@starboard/lib-ui/components/alert"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"

import { authClient } from "@/lib/auth-client"

type MemberRow = {
  id: string
  role: string
  user: {
    name: string
    email: string
  }
}

type InvitationRow = {
  id: string
  email: string
  role: string
  status: string
}

export function TeamSettingsForm() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [invitations, setInvitations] = useState<InvitationRow[]>([])
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"member" | "admin">("member")
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: orgError } =
      await authClient.organization.getFullOrganization()
    if (orgError || !data) {
      setError(orgError?.message ?? "Failed to load team")
      setLoading(false)
      return
    }
    setMembers(
      (data.members ?? []).map((member) => ({
        id: member.id,
        role: member.role,
        user: {
          name: member.user.name,
          email: member.user.email,
        },
      }))
    )
    setInvitations(
      (data.invitations ?? [])
        .filter((invite) => invite.status === "pending")
        .map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role ?? "member",
          status: invite.status,
        }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function invite() {
    const trimmed = email.trim()
    if (!trimmed || inviting) return
    setInviting(true)
    setError(null)
    setMessage(null)
    const { error: inviteError } = await authClient.organization.inviteMember({
      email: trimmed,
      role,
    })
    setInviting(false)
    if (inviteError) {
      setError(inviteError.message ?? "Failed to invite member")
      return
    }
    setEmail("")
    setMessage(`Invitation sent to ${trimmed}`)
    await load()
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Members and invitations for the active organization.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">Members</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">Invite</h2>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="invite-email">Email</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
            <select
              id="invite-role"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "member" | "admin")
              }
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Button
            type="button"
            disabled={inviting || !email.trim()}
            onClick={() => void invite()}
          >
            {inviting ? "Sending…" : "Send invite"}
          </Button>
        </FieldGroup>

        {invitations.length > 0 ? (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs text-muted-foreground">Pending</h3>
            <ul className="divide-y rounded-lg border">
              {invitations.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="truncate">{invite.email}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {invite.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  )
}
