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
  const q = url.searchParams.get("q") ?? ""

  try {
    const client = getGeographyClient()
    const ports = await client.searchPorts(q)
    return NextResponse.json({ ports })
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
