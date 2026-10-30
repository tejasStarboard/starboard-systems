import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function requireApiSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!session.session.activeOrganizationId) {
    return {
      error: NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      ),
    }
  }

  return { session }
}
