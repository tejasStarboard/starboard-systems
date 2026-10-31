import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApiSession } from "@/lib/auth/session"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"

const bodySchema = z.object({
  organizationIds: z.array(z.string().min(1)).default([]),
})

export async function GET() {
  const authResult = await requireStaffApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const organizations = await getPlatformManager().getCommonBetaOrganizations()
  return NextResponse.json({ organizations })
}

export async function PUT(request: Request) {
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

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    )
  }

  await getPlatformManager().setCommonBetaOrganizations({
    organizationIds: parsed.data.organizationIds,
    actorUserId: authResult.session.user.id,
  })

  return NextResponse.json({ ok: true })
}
