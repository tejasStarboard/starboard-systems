import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import {
  clearImpersonationCookie,
  readImpersonation,
  type ImpersonationPayload,
} from "@/lib/auth/impersonation"
import { isStaffUserId } from "@/lib/auth/staff"

export type OrganizationContext = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>
  organizationId: string
  impersonation: ImpersonationPayload | null
  isStaff: boolean
}

/** Session + effective org (impersonation target or active org). */
export async function requireOrganizationContext(): Promise<OrganizationContext> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/login")
  }

  const isStaff = isStaffUserId(session.user.id)
  let impersonation = await readImpersonation(session.user.id)
  if (impersonation && !isStaff) {
    await clearImpersonationCookie()
    impersonation = null
  }

  const organizationId =
    impersonation?.organizationId ?? session.session.activeOrganizationId

  if (!organizationId) {
    redirect("/select-org")
  }

  return { session, organizationId, impersonation, isStaff }
}
