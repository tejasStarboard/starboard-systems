import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getRateForOrg } from "@/lib/rates/orchestrator"

export async function GET(
  _request: Request,
  context: { params: Promise<{ rateId: string }> }
) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { rateId } = await context.params

  try {
    const rate = await getRateForOrg(
      authResult.session.session.activeOrganizationId!,
      rateId
    )
    return NextResponse.json(rate)
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
