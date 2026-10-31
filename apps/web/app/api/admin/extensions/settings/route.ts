import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApiSession } from "@/lib/auth/session"
import {
  ExtensionSettingsError,
  getPlatformManager,
} from "@/lib/domain/platform/platform.manager"

const bodySchema = z.object({
  extensionId: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
})

export async function GET() {
  const authResult = await requireStaffApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const extensions = await getPlatformManager().listStaffExtensionSettings()
  return NextResponse.json({ extensions })
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

  try {
    const settings = await getPlatformManager().setExtensionSettings({
      extensionId: parsed.data.extensionId,
      values: parsed.data.values,
      actorUserId: authResult.session.user.id,
    })
    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    if (error instanceof ExtensionSettingsError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    throw error
  }
}
