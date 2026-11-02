import { NextResponse } from "next/server"
import { z } from "zod"

import { requireApiSession } from "@/lib/auth/session"
import {
  ExtensionSettingsError,
  getPlatformManager,
} from "@/lib/domain/platform/platform.manager"

const bodySchema = z.object({
  extensionId: z.string().min(1),
})

export async function POST(request: Request) {
  const authResult = await requireApiSession()
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
    const carrier = await getPlatformManager().validateOrgCarrierCredentials({
      organizationId: authResult.organizationId,
      extensionId: parsed.data.extensionId,
    })
    return NextResponse.json({ ok: true, carrier })
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
