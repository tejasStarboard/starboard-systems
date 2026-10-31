"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { toast } from "@starboard/lib-ui/components/toast"

import { authClient } from "@/lib/auth-client"
import {
  teamInviteFormSchema,
  type TeamInviteFormValues,
} from "@/lib/domain/settings/settings-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"

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
  const [loading, setLoading] = useState(true)
  const form = useForm<TeamInviteFormValues>({
    resolver: zodResolver(teamInviteFormSchema),
    defaultValues: { email: "", role: "member" },
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: orgError } =
      await authClient.organization.getFullOrganization()
    if (orgError || !data) {
      toast.add({
        type: "error",
        title: "Unable to load team",
        description: orgError?.message ?? "Something went wrong. Try again.",
      })
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

  async function onInvite(values: TeamInviteFormValues) {
    const { error: inviteError } = await authClient.organization.inviteMember({
      email: values.email,
      role: values.role,
    })
    if (inviteError) {
      toast.add({
        type: "error",
        title: "Unable to invite member",
        description: inviteError.message ?? "Something went wrong. Try again.",
      })
      return
    }
    form.reset({ email: "", role: "member" })
    toast.add({
      type: "success",
      title: "Invitation sent",
      description: values.email,
    })
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
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(onInvite, toastFormErrors)}
        >
          <FieldGroup className="gap-3">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@company.com"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="role"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                  <select
                    id="invite-role"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending…" : "Send invite"}
            </Button>
          </FieldGroup>
        </form>

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
