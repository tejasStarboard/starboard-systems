import { NextResponse } from "next/server"

import { requireStaffApiSession } from "@/lib/auth/session"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"

export async function GET(request: Request) {
  const authResult = await requireStaffApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const url = new URL(request.url)
  const q = url.searchParams.get("q") ?? ""
  const organizations = await getPlatformManager().searchOrganizations(q)
  return NextResponse.json({ organizations })
}
