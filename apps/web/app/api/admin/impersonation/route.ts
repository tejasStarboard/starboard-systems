import { NextResponse } from "next/server"
import { z } from "zod"

import { readImpersonation } from "@/lib/auth/impersonation"
import { requireStaffApiSession } from "@/lib/auth/session"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"

const startSchema = z.object({
  organizationId: z.string().min(1),
})

export async function POST(request: Request) {
  const authResult = await requireStaffApiSession()
  if (authResult.error) {
    return authResult.error
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = startSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    )
  }

  try {
    const org = await getPlatformManager().startImpersonation({
      actorUserId: authResult.session.user.id,
      organizationId: parsed.data.organizationId,
    })
    return NextResponse.json({ organization: org })
  } catch {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    )
  }
}

export async function DELETE() {
  const authResult = await requireStaffApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const current = await readImpersonation(authResult.session.user.id)
  await getPlatformManager().endImpersonation({
    actorUserId: authResult.session.user.id,
    organizationId: current?.organizationId,
  })
  return NextResponse.json({ ok: true })
}
