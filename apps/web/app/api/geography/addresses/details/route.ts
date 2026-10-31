import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getGeographyClient } from "@/lib/domain/geography/geography.client"

export async function GET(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const url = new URL(request.url)
  const placeId = url.searchParams.get("placeId") ?? ""
  if (!placeId.trim()) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 })
  }

  try {
    const client = getGeographyClient()
    const address = await client.getAddressDetails(placeId)
    return NextResponse.json({ address })
  } catch (error) {
    if (error instanceof ServiceClientError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    throw error
  }
}
