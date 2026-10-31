import { NextResponse } from "next/server"

import { requireActiveExtension } from "@/lib/auth/require-active-extension"
import { ServiceClientError } from "@/lib/clients/http"
import { getSpotManager } from "@/lib/domain/spot/spot.manager"

export async function POST(request: Request) {
  const gate = await requireActiveExtension("spot.cma")
  if (gate.error) {
    return gate.error
  }
  const organizationId = gate.organizationId

  const body = (await request.json().catch(() => null)) as {
    origin?: string
    destination?: string
    mode?: string
  } | null

  try {
    const result = await getSpotManager().enqueueSearch("spot.cma", {
      organizationId,
      origin: body?.origin,
      destination: body?.destination,
      mode: body?.mode,
    })
    return NextResponse.json(result, { status: 202 })
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
