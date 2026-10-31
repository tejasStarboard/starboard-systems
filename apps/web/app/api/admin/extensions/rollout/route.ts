import { NextResponse } from "next/server"
import { listManifests, type RolloutMode } from "@starboard/extension-host"
import { z } from "zod"

import { requireStaffApiSession } from "@/lib/auth/session"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"

const bodySchema = z.object({
  extensionId: z.string().min(1),
  mode: z.enum(["off", "common", "beta", "on"]),
  organizationIds: z.array(z.string().min(1)).default([]),
})

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

  const known = listManifests().some(
    (manifest) => manifest.id === parsed.data.extensionId
  )
  if (!known) {
    return NextResponse.json({ error: "Unknown extension" }, { status: 404 })
  }

  await getPlatformManager().setRollout({
    extensionId: parsed.data.extensionId,
    mode: parsed.data.mode as RolloutMode,
    organizationIds: parsed.data.organizationIds,
    actorUserId: authResult.session.user.id,
  })

  return NextResponse.json({ ok: true })
}
