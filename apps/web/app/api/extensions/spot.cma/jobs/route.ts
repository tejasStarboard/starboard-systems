import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { getSpotManager } from "@/lib/domain/spot/spot.manager"
import { isExtensionActive } from "@/lib/extensions"

export async function POST(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const organizationId = authResult.session.session.activeOrganizationId!
  const plan = await getOrganizationPlan(organizationId)
  if (!isExtensionActive("spot.cma", plan)) {
    return NextResponse.json(
      { error: "Extension spot.cma is not enabled" },
      { status: 404 }
    )
  }

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
