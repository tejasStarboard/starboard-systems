import { NextResponse } from "next/server"

import { env } from "@/env"
import {
  ExtensionSettingsError,
  getPlatformManager,
} from "@/lib/domain/platform/platform.manager"

function authorized(request: Request): boolean {
  const header = request.headers.get("authorization") ?? ""
  if (!header.startsWith("Bearer ")) {
    return false
  }
  const token = header.slice("Bearer ".length).trim()
  return token.length > 0 && token === env.INTERNAL_SERVICE_TOKEN
}

/** Service-token read of decrypted org carrier credentials. Not for browsers. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const extensionId = url.searchParams.get("extensionId")?.trim() ?? ""
  const organizationId = url.searchParams.get("organizationId")?.trim() ?? ""
  if (!extensionId || !organizationId) {
    return NextResponse.json(
      { error: "extensionId and organizationId are required" },
      { status: 400 }
    )
  }

  try {
    const credentials =
      await getPlatformManager().getDecryptedCarrierCredentials(
        organizationId,
        extensionId
      )
    return NextResponse.json({ credentials })
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
