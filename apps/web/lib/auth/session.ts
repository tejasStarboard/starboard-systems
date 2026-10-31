import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import {
  clearImpersonationCookie,
  readImpersonation,
  type ImpersonationPayload,
} from "@/lib/auth/impersonation"
import { isStaffUserId } from "@/lib/auth/staff"

export async function requireApiSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  let impersonation = await readImpersonation(session.user.id)
  if (impersonation && !isStaffUserId(session.user.id)) {
    await clearImpersonationCookie()
    impersonation = null
  }

  const organizationId =
    impersonation?.organizationId ?? session.session.activeOrganizationId

  if (!organizationId) {
    return {
      error: NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      ),
    }
  }

  return {
    session,
    organizationId,
    impersonation: impersonation as ImpersonationPayload | null,
  }
}

export async function requireStaffApiSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!isStaffUserId(session.user.id)) {
    return {
      error: NextResponse.json({ error: "Not found" }, { status: 404 }),
    }
  }

  return { session }
}
